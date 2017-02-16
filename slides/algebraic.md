class: center, middle

# Monoids

---

# Map-Reduce

```java
List<String> names = Lists.newArrayList("a", "test", "hi");
names.stream()
    .map(String::length)
    .reduce(0, (a, b) -> a + b)
```
Parallel:
```java
names.parallelStream()
    .map(String::length)
    .reduce(0, (a, b) -> a + b)
```

Distributed:
```java
names.streamOnAmazon()
    .map(String::length)
    .reduce(0, (a, b) -> a + b)
```

---

# Reduce

```java
T reduce(T identity, BinaryOperator<T> accumulator)
```

```java
BinaryOperator<T> = BiFunction<T,T,T>
```


For integers:

```java
Integer reduce(Integer identity, BinaryOperator<Integer> accumulator)
```

---

# Algebraic Structures

Given an operation of form a • b in S

**Associativity (Semigroup)**

For all a, b and c in S, the equation (a • b) • c = a • (b • c) holds.

**Identity element (+ all of above = Monoid)**

There exists an element e in S such that for every element a in S, the equations e • a = a • e = a hold.

**Commutativity (+ all of above = Commutative Monoid)**

For all a, b in A, a • b = b • a.

---

# What the Math Stuff Really Means

I want to combine two values of the same type

**Associativity (Semigroup)**

It does not matter if I start from the left, middle or right side

**Identity element (+ all of above = Monoid)**

I do not need to handle empty things differently (e.g. Empty lists/optionals)

**Commutativity (+ all of above = Commutative Monoid)**

I do not need to sort my values

---

# Reduce

```java
List<String> names = Lists.newArrayList("a", "test", "hi");
names.stream()
    .map(String::length)
    .reduce(0, (a, b) -> a + b)
```

Reduction = (+, Integer)

* **Associativity**: 1 + (2 + 3) = (1 + 2) + 3
* **Identity**: 0
* **Commutative**: 1 + 2 = 2 + 1

---

# Define Reductions

```java
class Sum {
    Integer identity() {
        return 0;
    }
    Integer sum (Integer a, Integer b) {
        return a + b;
    }
}
```

```java
List<String> names = Lists.newArrayList("a", "test", "hi");
names.stream()
    .map(String::length)
    .reduce(new Sum())
```

---

# Monoid

```java
T reduce(Monoid<T> monoid)
```

```java
interface Monoid<T> {
    T identity();
    T sum (T a, T b);
}
```

```java
class Sum implements Monoid<Integer> {
    Integer identity() {
        return 0;
    }
    Integer sum (Integer a, Integer b) {
        return a + b;
    }
}
```

---

# Parallelization

We need more guarantees: Commutativity

```java
interface CommunativeMonoid<T> extends Monoid<T> {}
```

```java
class Sum implements CommunativeMonoid<Integer> {
    Integer identity() {
        return 0;
    }
    Integer sum (Integer a, Integer b) {
        return a + b;
    }
}
```

---

# Type Safety

Any reduction in a stream needs at least a **Monoid<T>**

Any reduction in parralel stream needs **CommunativeMonoid<T>**
