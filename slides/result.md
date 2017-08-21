class: center, middle

# Result Monad

---

# Problem
Dealing with errors in places where exception handling won't work or is tedious

```java
public static Mail parseMail(String email) throws ValidationException {
    if (!regex.matches(email)) {
        throw new ValidationException("Not a valid E-Mail");
    } else {
        return new Mail(email);
    }
}

List<Mail> mails = Lists.newArrayList("a@a.com", "hi").stream()
    .map(parseMail)  // won't compile because map function can't throw!
    .collect(Collectors.toList())
```

---

# Solution 1
Downside: swallows error

```java
List<Mail> mails = Lists.newArrayList("a@a.com", "hi").stream()
    .map(mail -> {
        try {
            return Optional.ofNullable(parseMail(mail));
        } catch (ValidationException e) {
            return Optional.empty();
        }
    })
    .filter(Optional::isPresent)
    .map(Optional::get)
    .collect(Collectors.toList())
```

---

# Solution 2

Something similar to an Optional that holds both the value and exception:

```java
public class Result<T, E extends Throwable> {
    private E e;
    private T value;

    public Result(final T value, final E e) {
        this.e = e;
        this.value = value;
    }
}

stream.map(mail -> {
    try {
        return new Result(parseMail(mail), null);
    } catch (ValidationException e) {
        return new Result(null, e);
    }
})
```

---

# Getting Rid of Try/Catch

```java
public interface CheckedSupplier<T, E extends Throwable> {
    T get() throws E;
}

public static <A, B extends Throwable> Result<A, B> check(
    CheckedSupplier<A, B> supplier, Class<B> exceptionClass) {
    try {
        return new Result(supplier.get(), null);
    } catch (Throwable e) {
        if (exceptionClass.isInstance(e)) {
            return new Result(null, (B) e);
        } else {
            throw new RuntimeException(e);
        }
    }
}

mails.stream().map(mail -> Result.check(() -> parseMail(mail)));
```

---

# Stream Support


```java
public Stream<T> stream() {
    if (this.e == null) {
        return Stream.empty();
    } else {
        return Stream.of(this.value);
    }
}

List<Mail> mails = Lists.newArrayList("a@a.com", "hi").stream()
    .flatMap(mail -> Result.check(() -> parseMail(mail)).stream())
    .collect(Collectors.toList())
```

---

# Safe Extractions

```java
public void ifOk(Consumer<T> consumer)
    if (this.e == null) consumer.accept(this.value);

public void ifError(Consumer<E> consumer)
    if (this.e != null) consumer.accept(this.e);

public T orElse(T defaultValue)
    if (this.e == null)
        return this.value;
    else
        return defaultValue;

public T orThrow() throws E
    if (this.e == null)
        return this.value;
    else
        throw this.e;
```

---

# Functor

Result (similar to Optional) is a Functor because we can create a **map** function for it

```java
public <A> Result<A, E> map(Function<? super T, ? extends A> mapFunction) {
    if (this.e == null) {
        return new Result(mapFunction.apply(this.value), null);
    } else {
        return new Result(null, this.e);
    }
}

Result.check(() -> parseMail("test"))
    .map(mail -> mail.getMail().length())
```

---

# Monad

Result (similar to Optional) is an Applicative Functor because we can create a **flatMap** and **of** function:

```java
public static <A, B extends Throwable> Result<A, B> of(A value) {
    return new Result<>(value, null);
}

public <A> Result<A, E> flatMap(Function<? super T, Result<A, E>> mapFunction) {
    if (this.e == null) {
        return mapFunction.apply(this.value);
    } else {
        return Result.ofError(this.e);
    }
}

Result.of("testmail@mail.com")
    .flatMap(mail -> Result.check(() -> parseMail(mail)))
```

---

# Applicative Functor

Result (similar to Optional) is an Applicative Functor because we can create **applicativeMap** and **of** function:

```java
public <A> Result<A, E> applicativeMap(Result
    <Function<? super T, ? extends A>, E> result) {
    if (this.e == null) {
        return result.map(f -> f.apply(this.value));
    } else {
        return Result.ofError(this.e);
    }
}
```

Why would anyone want to use this ^

---

# Applicative Functor Usage: Validation

```java
public class User {
    public User(String username, String email)
}

Result<User, Err> createUser = Result.of(name -> (mail -> new User(name, mail)))

Result<String, Err> id = Result.check(() -> parseUserId(userId))
Result<String, Err> mail = Result.check(() -> parseMail(email))

// arguments reversed and nested!
Result<User, Err> validUser = mail.applicativeMap(id.applicativeMap(createUser));
```

Haskell uses infix functions to avoid nesting and ordering issues:

```haskell
createUser <$> parseUserId id <*> parseMail email
```
