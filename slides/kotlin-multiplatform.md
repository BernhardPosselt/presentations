# Kotlin Multiplatform

---

## Targets

Compile Kotlin to (and interop from)

* Android (native/JVM)
* iOS (native)
* JVM (Desktop & Server on JVM or ARM/X86)
* Web (JS & WASM)

---

## Jetpack Compose

* Cross-Platform UI Framework similar to Flutter but uses native APIs
* Android UI framework that can be used on Desktop and Web
* Web platform uses WASM with JS bindings and uses canvas to render (Compose HTML uses JS and HTML instead)

---

## Official Multiplatform Libraries

* Date & Time
* Serialization
* HTTP Clients
* I/O
* JSON Schema Generation

---

## Focus: JS

* DOM APIs exposed by default through **window** object
* NodeJS APIs through [kotlinx-nodejs](https://github.com/Kotlin/kotlinx-nodejs) library
* Templating through [kotlinx-html](https://github.com/Kotlin/kotlinx.html)
* More JS type definitions and utilities through [Kotlin Wrappers](https://github.com/JetBrains/kotlin-wrappers)
* Testing with Karma, Bundling with WebPack
* TypeScript can be consumed via [Karakum](https://github.com/karakum-team/karakum) or created via Gradle

---

## Browser

```kt
// build.gradle.kts
kotlin {
    js {
        compilerOptions {
            target = "es2015"
        }
        browser {
            distribution {
                outputDirectory = file("dist")
            }
        }
        binaries.executable() // create a js file
    }
}
// Main.kt
suspend fun main() {
    window.alert("hi")
}
```
---
## Async

* Implemented using Coroutines
* Exported to Promises
* Benefits over Promises
    * no need to await explicitly
    * grouped cancellation: if one operation in a coroutine scope errors or is canceled, all other operations on that scope are canceled (including children)
    * Possible in JS with help of [AbortController](https://developer.mozilla.org/de/docs/Web/API/AbortController)
---
## Promises

* JS API Promises use **.await()** to turn them into suspending functions
* Issue: you can easily forget to call await (in JS and Kotlin alike)
* Solution: write wrappers to turn them into suspend functions (many defined in Kotlin wrappers already)

---

## Promise Wrappers

```kt
import web.abort.AbortController
import web.abort.asCoroutineScope
import web.abort.internal.awaitCancellable
import web.function.async

@OptIn(InternalApi::class)
suspend fun abortable(): String {
  return Promise { resolve ->
    resolve("hi")
  }.awaitCancellable(AbortController())
}

suspend fun wrapAsync(): String {
  return Promise { resolve ->
    resolve("hi")
  }.await()
}
```

---

## JS Objects

* Out of the box uses Record<K, V> and ReadonlyRecord<K, V> (similar to TypeScript)
* Named interfaces supported using Compiler Plugin

```kt
@JsPlainObject
external interface Name {
    val optionalValue: Boolean?
    val required: Boolean
}

fun main() {
    console.log(Name(required=true))
}
```

---

## Using Kotlin from JS

* Contrary to JVM, nothing is accessible from JS
* Add **@JsExport** to whitelist usable components

```kt
@JsExport
enum class Types {
    A,
    B,
}
```

---

## Using NPM libraries

* Install NPM library in Gradle
* Uses yarn by default (can be switched to npm)

```kt
kotlin {
    sourceSets {
        jsMain.dependencies {
          implementation(npm("uuid", "11.1.0"))           
        }
    }
}
```

---

## Using JS From Kotlin

* Define types

```kt
@file:JsModule("uuid")
package io.github.uuidjs.uuid

external fun v4(): String
```

---

## Other Platforms

* Different ways to integrate APIs (e.g. methods to allocate/deallocate memory for C based APIs)
* iOS APIs (Swift/Objective C) available out of the box
* Everything else a massive pain (as usual)

---

## Comparison to Electron/Flutter

* Multiplatform is not a Runtime
* Compose Desktop uses Native APIs
* Flutter ships a custom renderer

--- 

## Demo