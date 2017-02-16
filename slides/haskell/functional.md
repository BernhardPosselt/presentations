class: center, middle

# Functional Programming & Patterns in Haskell


---

# Paradigms

* **Imperative**: programming with lines of statements (e.g. C, Fortran)
* **Logic**: programming with equations (e.g. Prolog)
* **Object Oriented**: programming with objects (e.g. Smalltalk, Java, etc.)
* **Functional**: programming with functions (e.g. Haskell, Lisp)

---

# Object Oriented
Ruby:
```ruby
4.times do
    puts "hello world"
end
```

Smalltalk:

```smalltalk
4 timesRepeat: [
	repeated statements
]

a < b
  ifTrue: [^'a is less than b']
  ifFalse: [^'a is greater than or equal to b']
```

---

# Functional

Haskell:

```haskell
mapM_ putStrLn (take 4 (repeat "hello world"))
```

* **mapM_**: map for Monads (because IO is modelled as Monad)
* **putStrLn**: print a string
* **take**: pull something out n-times
* **repeat**: create an infinite list of a value

Forget Monad for now (or when you learn Java: forget **public static void**)

---

# Purity
Haskell is pure by default

**Means**: no side effects

**Means**: every call with same parameters always returns the same result

**Means**: no exceptions, no IO, no globals, no void return functions

Enables parallelization & laziness

```haskell
take 5 [1, 2 ..]     -- [1,2,3,4,5]
```

---

# Immutability
Everything in Haskell is immutable

**Means**: can't change values

**Means**: inserting an element into a list = creating a new list

Enables parallelization & purity

---

# Notation (1/2)

```haskell
add :: Int -> Int -> Int
add a b = a + b
```

```java
public static Integer add(Integer a, Integer b) {
    return a + b;
}
```
---

# Notation (2/2)
Generics are lower case, non generics uppercase!

```haskell
max :: (Ord a) => a -> a -> a
max a b
    | a > b = a
    | otherwise = b
```

```java
public static <T extends Comparable> T max(T a, T b) {
    if (a.compareTo(b) > 0) {
        return a;
    } else {
        return b;
    }
}
```

---

# Combining Functions (1/2)
In GHCi:

```haskell
import Data.Char

:t toUpper
toUpper :: Char -> Char
```

```haskell
toUpper 'i'                                      -- 'I'
map toUpper "hi"                                 -- "HI"
map (map toUpper) ["hi", "ho"]                   -- ["HI","HO"]
reverse (map (map toUpper) ["hi", "ho"])         -- ["HO","HI"]

-- or without brackets
reverse $ map (map toUpper) ["hi", "ho"]         -- ["HO","HI"]
```

---

# Combining Functions (2/2)

Back in Math:
```
f o g = f(g(...))
```

In Haskell:

```haskell
f . g
```

```haskell
let strListToUpper = map (map toUpper)
let reverseUpper = reverse . strListToUpper
reverseUpper ["hi", "ho"]                        -- ["HO","HI"]
```

---

# Partial Application/Currying

Oh, hello Dependency Injection :)

```haskell
:t (+)

(+) :: Num a => a -> a -> a

plusOne = (+) 1
plusOne 3                         -- 4

```

Signature:
* Take an **a** and return **a -> a**
* Take an **a** and return **a**


---

# Algebraic Types & Pattern Matching (1/2)

```haskell
data Maybe a = Nothing | Just a

fmap :: (a -> b) -> a -> b   -- fmap == generic map
fmap f Nothing = Nothing
fmap f (Just a) = Just (f a)

fmap (+ 1) Nothing
fmap (+ 1) (Just 5)
```

---

# Algebraic Types & Pattern Matching (2/2)

```haskell
data Tree a = Empty | Node a (Tree a) (Tree a)

size :: Tree a -> Int
size Empty = 0
size (Node _ left right) = 1 + (size left) + (size right)

size (Node 3 Empty (Node 4 Empty Empty))
```

---

# Type Classes (AKA Interfaces)

```haskell
class Eq a where  
    (==) :: a -> a -> Bool  
    (/=) :: a -> a -> Bool  
    x == y = not (x /= y)  
    x /= y = not (x == y)  
```

Implementation:

```haskell
data TrafficLight = Red | Yellow | Green  

instance Eq TrafficLight where  
    Red == Red = True  
    Green == Green = True  
    Yellow == Yellow = True  
    _ == _ = False  
```

---

# Functors

Type class/Interface for a type that allows you to define a map function, e.g.

* Tree
* Matrix
* List
* Maybe
* Either

```haskell
class Functor f where  
    fmap :: (a -> b) -> f a -> f b  

instance Functor (Maybe a) where
    fmap f Nothing = Nothing
    fmap f (Just a) = Just (f a)

fmap (*3) (Just 5)
```

---

# Applicative Functors
Just like Functors but function is in a container (e.g. function in Maybe or List)

```haskell
class Functor f => Applicative f where
    (<*>) :: f (a -> b) -> f a -> f b
```

Compare the following:

```haskell
f (a -> b) -> f a -> f b   -- <*>, applicative map
  (a -> b) -> f a -> f b   -- fmap
```

Example:

```haskell
instance Applicative (Maybe a) where
    Nothing <*> _ = Nothing  
    (Just f) <*> something = fmap f something  

(Just (*3)) <*> (Just 5)
```

---

# Monoids
Combining stuff together

```haskell
class Monoid m where  
    mempty :: m              -- neutral element
    mappend :: m -> m -> m   -- associative operation
```

```haskell
instance Monoid [a] where  
    mempty = []  
    mappend = (++)

mappend [1, 2, 3] [4, 5]
```

---

# Monads (1/5)

Type class/Interface for a type that allows you to define a pipeline of operations, e.g.

* Maybe
* Either
* Promise
* IO

---

# Monads (2/5)

```haskell
class Applicative m => Monad m where      
    (>>=)  :: m a -> (a -> m b) -> m b
    return :: a -> m a
    return x = Just x    

instance Monad Maybe where
    (Just x) >>= f      = f x
    Nothing  >>= _      = Nothing

(>>=) (Just 5) (\x -> Just (x + 1))
Just 5 >>= (\x -> Just (x + 1))
```

---

# Monads (3/5)

So basically:

* Put something into a "Container" that knows how the operation is applied
* Pipeline sequential operations

Example in Java:

```java
Optional.ofNullable(3)
    .flatMap(operation)
    .flatMap(operation)

Stream.of(1)
    .flatMap(operation)
```

---

# Monads (4/5)

```haskell
Just 9 >>= \x -> return (x*10)   -- Just 90
```

compare to:

```java
Optional.ofNullable(9)
    .flatMap(value -> Optional.ofNullable(value * 10))
```

Why flatMap and not map?

**map**: function does not control behavior (e.g. Just will always be Just)
**flatMap**: function can control behavior (e.g. Just can become Nothing)

---

# Monads (5/5)
Do notation for easier readability

```haskell
getCustomerFromDb :: DbConnection -> String -> IO (Maybe Customer)
getCustomerFromDb conn customerId = do
    stmt <- conn "SELECT * from customer where id = ?"
    results <- fetchAllRowsAL stmt [toSql customerId]
    customers <- toCustomer results
    return (listToMaybe customers)

getCustomer :: String -> IO (Maybe Customer)
let getCustomer = getCustomerFromDb dbConnection

getCustomer "User1"
```

---

# Exceptions/Errors

```haskell
:info Either
data Either a b = Left a | Right b

fmap reverse (Right "abc")   -- Right "cba"
fmap reverse (Left "abc")    -- Left "abc"
```

Left is error, Right is result

e.g. Either IOError String
