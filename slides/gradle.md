class: center, middle

# Gradle

---

## What is Gradle

* Build Tool
* Package Manager
* Linter
* Scripting Tool

---

## Gradle vs Maven

Gradle

* is much faster due to caching
* has better (although still lacking) documentation
* configured using Kotlin (default since 8.2) instead of hundreds of lines of XML ([declarative in the works](https://declarative.gradle.org/))
* is very easy to write custom tasks for
* is more difficult to understand
* changes often

---

## Creating a New Project

* [Download the latest binary](https://gradle.org/releases/)
* Extract and bootstrap a new project using a Gradle Wrapper

      mkdir project
      cd project
      ../gradle-9.6.1/bin/gradle init
* Recommended to work with wrapper from now on inside the project
* Wrapper is a checked in, per project script that downloads and forwards commands to locally installed Gradle version
* Upgraded using:
  ```sh
  ./gradlew wrapper --gradle-version=x.x.x
  ```

---

## Configuring Gradle

* 2 different kinds:
    * **System Property**: fully qualified property; used to configure global config values
    * **Project Property
      **: non prefixed config values specific to your project; identical to system properties but automatically prefixed with
      **org.gradle.project.**
* 3 ways to configure Gradle (most important first):
    * **Command line**: e.g. -P (project property) or -D (system property)
    * **gradle.properties**: global in **~/.gradle
      ** or inside your root project; project properties don't require a prefix
    * **Environment Variables**: ORG_GRADLE_PROJECT_propertyName

---

## Tasks

* Essentially functions that are executed by:

      ./gradlew --myGradleOption myTask -PmyTaskOption
* By default, stacktraces and debug output is not logged, you need to pass -s or -i respectively

```kt
tasks.register("myTask") {
    doLast {
        println("Hello World")
    }
}
```

---

## Why doLast?

* The whole file is executed before every run, regardless of the task
* Without doLast, the println is always executed before any task is run
* This also means, that configuration values passed via command line must be read lazily or provided for every task
* Lazily reading values is done through Providers (essentially lambdas with a .get() method)

```kt
tasks.register("myTask") {
    someConfig = providers.gradleProperty("myTaskOption")
}
```

* Additional providers available (Strings, files, directories, env variables, etc)

---

## More Complex Tasks

* Sometimes it's nice to reuse tasks or organize them in a different folder
* In that case, you want to subclass **DefaultTask**
* The code goes into a separate folder e.g. **build-logic/** and then needs to be included in the **settings.gradle.kts** that wants to make use of it

```kt
includeBuild("./build-logic")
```

* This directory has its own **settings.gradle.kts** and **build.gradle.kts** file, as if it was a separate project
* This is also called a [Composite Build](https://docs.gradle.org/current/userguide/composite_builds.html)

---

## Custom Task Gradle Files

* Composite builds are separately compiled projects, so you need another **settings.gradle.kts** and **build.gradle.kts**

```kt
rootProject.name = "build-logic"
```

```kt
// build.gradle.kts
repositories {
    mavenCentral()
}

group = "at.fyayc"
version = "0.0.1-SNAPSHOT"

plugins {
    `kotlin-dsl`
}
```

---

## Custom Task

```kt
// location: my-trask/src/main/kotlin/at/fyayc/tasks
abstract class MyTask: DefaultTask() {
    @get:Input
    abstract val value: Property<String>

    @get:OutputFile
    abstract val outputFile: RegularFileProperty

    @TaskAction
    fun exec() {
        // providers lambdas are executed using .get()
        Files.writeString(
            Paths.get(outputFile.get().asFile.path), 
            value.get()
        )
    }
}
```

---

## Registering the Custom Task

```kt
buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath("at.fyayc:build-logic:0.0.1-SNAPSHOT")
    }
}

tasks.register<MyTask>("myTask") {
    // compiler plugin turns this into project.provider { "Test" }
    // only works for abstract vals, otherwise use value.set("Test")
    value = "Test" 
    outputFile = layout.buildDirectory.file("test.txt")
}
```

---

## Why @Input/@Output/@InputFile/etc?

* Gradle is fast because it caches inputs/outputs
* If a task is run for a second time and its inputs haven't changed, it is not re-run
* Similarly, if a task depends on the output of another task which has not changed, it is not re-run

TODO

---

## Dependencies

--- 

### Generating Code at Build Time

---

## Modules

---

## Plugins

---

## Sharing Build Logic