class: center, middle

# Functor, Applicative Functor, Monad in Action: Result

---

# Why
Dealing with errors in places where exception handling won't work or is tedious (e.g. Streams, Methods without Exception signatures, distributed systems, languages without exceptions e.g. C, Go, Haskell, Rust)

```java
public static Mail parseMail(String email) throws Invalid {
    if (regex.matches(email)) {
        return new Mail(email);
    } else {
        throw new Invalid("Not a valid E-Mail");
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
        } catch (Invalid e) {
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
    } catch (Invalid e) {
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
        if (exceptionClass.isInstance(e))
            return new Result(null, (B) e);
        else
            throw new RuntimeException(e);
    }
}

mails.stream()
    .map(mail -> Result.check(() -> parseMail(mail), Invalid.class));
```

---

# Stream Support


```java
public Stream<T> stream() {
    if (this.e == null) {
        return Stream.of(this.value);
    } else {
        return Stream.empty();
    }
}

List<Mail> mails = Lists.newArrayList("a@a.com", "hi").stream()
    .flatMap(mail -> Result.check(() -> parseMail(mail), Invalid.class).stream())
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

Result.check(() -> parseMail("test"), Invalid.class)
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
        return new Result(null, this.e);
    }
}

Result.of("testmail@mail.com")
    .flatMap(mail -> Result.check(() -> parseMail(mail), Invalid.class))
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
        return new Result(null, this.e);
    }
}
```

**When to use applicativeMap**: When dealing with Results of Functions. You get those when you map a function which takes two or more parameters.

---

# Applicative Functor Usage: Validation

```java
public class User {
    public User(String username, String email)
}

Function<...> toUser = name -> (mail -> new User(name, mail));
Result<String, Err> id = Result.check(() -> parseName(userId), Invalid.class)
Result<String, Err> mail = Result.check(() -> parseMail(email), Invalid.class)

Result<User, Err> validUser = mail.applicativeMap(id.map(toUser));
```

Haskell uses infix functions to avoid ugly nesting:

```haskell
toUser <$> parseName id <*> parseMail email
```

---

# Excursion: Haskell

```haskell
module Main where

import Text.Regex.PCRE

data User = User {
    mail :: String,
    id :: String
} deriving (Show)

parse :: String -> String -> Either String String
parse regex value = if value =~ regex
    then Right value
    else Left $ "Could not parse " ++ value ++ " with regex " ++ regex

toUser mail userId = User <$> (parse ".*@.*" mail) <*> (parse "[a-z]" userId)

main :: IO ()
main = do
    putStrLn $ show $ toUser "test@test.com" "user"
```
