class: center, middle

# Dependency Injection

---

# Why

* Pattern to get rid of **global** state
* Impedes testing:
  * Production code needs to know about test setup
  * Mocking is too broad
  * Need to deal with rollbacks
  
---

# Production Code With Knowledge of Tests    

```ts
const s3 = new AWS.S3({
    signatureVersion: 'v4',
    // the following properties are only set because the tests change them
    endpoint: process.env.stackEndpoint,
    s3ForcePathStyle: process.env.stackEndpoint !== undefined,
});
```

---

# Module System Mocks

* Replace a file when importing it:

```ts
jest.mock('../../src/services/rollback-service');
```

* Requires you to structure your files based on how you want to mock them (1 configuration parameter per file?)
* Requires rollbacks

```ts
afterEach(() => {
  jest.clearAllMocks();
});
```

---

# Rollbacks

* The following code needs to be rolled back:

```ts
AWS.config.update({
    region: 'localhost',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    },
    sslEnabled: false,
});
```

* If not done, affects other tests
* Can lead to weird results when tests run in different order

---

# Passing in State: Constructor

```ts
class DynamoClient {
}

class DbService {
  constructor(private db: DynamoClient) {
  }
  
  save(value: object) {
      this.db.save(object);
  }
}
```

---

# Passing in State: Methods/Functions
```ts
class DynamoClient {
}

class DbService {
  save(db: DynamoClient, value: object) {
      this.db.save(object);
  }
}

function save(db: DynamoClient, value: object) {
  this.db.save(object);
}
```

---

# Passing in State: Partial Application

* Nothing more than  a function constructor

```ts
class DynamoClient {
}

function save(db: DynamoClient) {
    return function(value: object) {
      this.db.save(object);
    }
}

save(new DynamoClient())({user: 'test'});
```

---

# Passing in State: Explicit State Management

* Kinda reversed Partial Application
* Often used in Functional Programming in conjunction with the [Reader Monad](https://www.youtube.com/watch?v=AkOFubm-9L8)
* Not that great to use, in general good to avoid

```ts
class DynamoClient {
}

function save(value: object) {
    return function(db: DynamoClient) {
      this.db.save(object);
    }
}

save({user: 'test'})(new DynamoClient());
```

---

# Application Architecture

* Naive approach but state is now local to function and doesn't require a teardown
* Listing dependencies in order
* No way to replace things with mocks
* Passed in config object grows to become a god object

```ts
function bootstrap(config: {...}) {
    const api = new AWS.API(config.endpoint)
    const db = new DynamoClient(api);
    
    const app = express();
    
    app.get('/route', () => db.save());
    
    return app;
}
```

---

# Containers

* Essentially a registry holding blueprints of how things are constructed
* Provide a way to register blueprints, and a way to execute them

```ts
function createContainer() {
    const container = new Container();
    container.register('db', () => new DynamoClient());
    container.register('handler', () => (request, response) => container
            .resolve('db').save(request.body));
    container.register('app', () => {
        const app = express();
        app.get('/route', container.resolve('handler'));
    })
    return container;
}
// in index.js
createContainer().resolve('app')();
```

---

# Containers Under Test

* No need to rollback, just create a new container:

```ts
test('create a project', async () => {
    const container = createContainer();
    // override a single dependency
    container.register('db', jest.mock({...}));
    
    const app = container.resolve('app');
    
    await supertest(app).post('/v1/projects')
            .set('Content-Type', 'application/json')
            .send({...});
});
```

---

# Container Internals: Registering

* Container needs to hold a map of blueprints

```ts
class Container<K> {
    private blueprints: Map<K, () => unknown> = new Map();
    private singletons: Map<K, unknown> = new Map();
    
    public register(key: K, blueprint: () => unknown) {
        this.blueprints.set(key, blueprint);
    }
}
```

---

# Container Internals: Resolving

```ts
class Container<K> {
    private blueprints: Map<K, () => unknown> = new Map();
    private singletons: Map<K, unknown> = new Map();
    
    public resolve<V>(key: K): V {
        if (this.singletons.has(key)) {
            return this.singletons.get(key);
        } else if (this.blueprints.has(key)) {
            const instance = this.blueprints.get(key)();
            this.singletons.set(key, instance);
            return instance as V;
        } else {
            throw new Error(`Index ${key} not found`);
        }
    }
}
```

---

# Other Container Implementations

* **Angular**: Resolve information stored on the class itself via decorators

```ts
@Injectable()
export class Service {}

@NgModule({providers: [Service]})
export class AppModule {}
```

* **Inversify**: Bit more boilerplate than Angular:

```ts
@injectable()
class Ninja {}

const container = new Container();
container.bind<Ninja>(Ninja).toSelf().inSingletonScope();
container.resolve(Ninja)
```

---

# Circular Dependencies

* First: avoid at all costs
* Otherwise, needs separate behavior using a proxy:

```ts
const bProxy: B = new LazySingleton();
const a = new A(bProxy);
const b = new B(a);
bProxy.setImplementation(a);
```
