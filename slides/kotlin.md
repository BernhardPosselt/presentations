class: center, middle

# Kotlin

---

# Why Kotlin

* Built by JetBrains for IntelliJ
* No revolution, just a better Java
* Compiles to JVM, Dalvik, JavaScript or Native bytecode
* Supported by Google as official Android programming language
* Designed with Java interoperability in mind
* Integrates well with Java frameworks such as Spring
* Releases almost independent from JVM (compatible with JDK6+)

---

## Nullability built into type system

```kotlin
var name: String?
name = null
var nameNonNull: String
nameNonNull = null  // compile error

obj?.nullableMethod()?.nullableMethod2 ?: "default"
```

Works with all common Java annotations such as: @Nullable, @Nonnull, etc

Assigning non annotated types from Java adds null checks

---

## Type Inference
val and var for immutable and mutable references

```kotlin
val names = listOf("a", "b")
```

vs

```java
final List<String> names = Lists.newArrayList("a", "b");

// Java 10
final var names =  List.of("a", "b");
```

---

## Data classes/Pair & Destructuring

```kotlin
data class User(var name: String, var password: String)
person = User("john", "123456")
val (name, _) = person  // equals "john"
```

```java
// No nullability annotations and implementations for the sake for brevity
final public class User {
  private String name;
  private String password;

  public User(String name, String password) // etc
  public String toString()
  public int hashCode()
  public String getName()
  public void setName(String name)
  public String getPassword()
  public void setPassword(String password)
  public User clone()
}
```

---

## C# Style Setters/Getters

```kotlin
data class User(var name: String, var password: String)
var user = User("name", "password")
user.name = "john"
```

Compiles to getName and setName for Java

Overridable if required

```kotlin
data class User(var name: String, var password: String)
  val name = name
    get(): String {
      return if (field == "John") "JohnDoe" else field
    }
}
```

---

## Default & Named Parameters

```kotlin
class ManyDefaults(val first: String, val second: String = "a default")
val obj = ManyDefaults("first")
val obj2 = ManyDefaults("first", "second")
val obj3 = ManyDefaults("first", second = "second")
```

Generates to only one method in Java. Otherwise add @JvmOverloads

---

## Control Flow Analysis

```kotlin
if (obj is String) {
  obj.substr(...)
}

val name: String? = "name"

if (name != null) {
  name.length  // compiles
}
```

in Java:

```java
if (obj is String) {
  ((String)obj).substr(...)
}
```

---

## Sum Types (1/2)

Ever written something like this?

```java
if (Enum.VALUE1.equals(obj.enum)) {

} else if (Enum.VALUE2.equals(obj.enum)) {

}
```

What happens if someone creates Enum.VALUE3?

---

## Sum Types (2/2)

when expressions do exhaustivness checking if no **else** branch is provided. No fall through!

```kotlin
when (obj.value) {
  Enum.VALUE1 => {}
  Enum.VALUE2, Enum.VALUE3 => {}
}
```

Adding another enum value will fail to compile

```kotlin
// for instanceof checks:
sealed class Option<T>
class Some<T>(val value: T) : Option<T>
class None<T>: Option<T>
```

---

## Unit type

void is a type!

```kotlin
fun (name: String) : Unit {
  print(name)
}
```

```java
public <T, U> method(Function<T, U> function);

obj.<String, Object>method(value -> {
  System.out.println(value);
  return null;
})

// you want but this does not compile
obj.<String, void>method(value -> {
  System.out.println(value);
})
```

---


## Many More Features

* Infix functions: value1 function value2
* Extension methods: sugar for turning Optionals.stream(optional) into optional.stream() without modifying the global class
* Ranges: 1..12
* Tail recursion
* Ruby/Smalltalk/Groovy like blocks: list.filter { it == 0}
* Declaration site variance in addition to use site variance
