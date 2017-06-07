class: center, middle

# Functors

---

# Definition

Interface for stuff that you can map over:

* List
* Optional
* Observable
* Stream
* Future
* Promise
* Tree
* Map
* Function

```java
interface Functor<T> {
    <R> Functor<R> map(Function<T, R> f);     
}
```

---

# Laws
The following things should be true for Optional and other Functors:

```java
Optional.ofNullable(1)
    .map(a -> a + 1)
    .map(a -> Math.pow(a, 2))

// is equal to
Optional.ofNullable(1)
    .map(a -> Math.pow((a + 1), 2))
```

```java
Optional.ofNullable(1)
    .map(Function.identity())

// is equal to
Optional.ofNullable(1)
```

---

# Applicative Functors

What happens when we want to run

```java
BiFunction<Integer, Integer, Integer> sum = (a, b) -> a + b;

Optional.ofNullable(1)
    .map(sum)
```

This won't compile because 2 parameters are expected (Because Java does not have partial application).

---

# Partial application

```java
BiFunction<Integer, Integer, Integer> sum = (a, b) -> a + b;
sum(3, 6);  // 9
```

Notice **BiFunction**? What if we get more and more parameters? We need one additional interface per parameter!

Solution: nesting Functions

```java
Function<Integer, Function<Integer, Integer>> sum = (a) -> (b -> a + b);

Function<Integer, Integer> add3 = sum(3);

add3(6);  // 9
```
---

# In Haskell it works just fine

**Hint**:

* **Maybe a** means **Optional&lt;A&gt;**
* **Just a** means **Optional.&lt;A&gt;of()**
* **fmap** is simply map
* **Num a =>** means **&lt;A extends Number&gt;**
* **(a -> a)** means **Function&lt;A, A&gt;**

```haskell
import Data.Maybe
:t (fmap (+) (Just 1))

Num a => Maybe (a -> a)
```


---

# Applicative Functor Definition

Exactly the same as map but instead of a function it takes a **Functor containing a function**

```haskell
import Data.Maybe
(fmap (+) (Just 1)) <*> Just 5
(<*>) (fmap (+) (Just 1)) Just 5

:t (<*>)
Applicative f => f (a -> b) -> f a -> f b
:t fmap
    Functor f =>   (a -> b) -> f a -> f b
```

Applicative functors require you to be able to implement a Functor!

```haskell
class Functor f => Applicative f where
    pure  :: a -> f a
    (<*>) :: f (a -> b) -> f a -> f b
```
