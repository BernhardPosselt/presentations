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
* What about buildSrc? Discouraged nowadays in favor of composite builds

---

## Custom Task - Code

```kt
// build-logic/src/main/kotlin/at/fyayc/tasks
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

## Custom Task - Build Files

* Composite builds are separately compiled projects, so you need another **settings.gradle.kts** and **build.gradle.kts**

  ```kt
  // build-logic/settings.gradle.kts
  rootProject.name = "build-logic"
  ```
  
  ```kt
  // build-logic/build.gradle.kts
  repositories {
      mavenCentral()
  }
  
  plugins {
      // create code usable in Gradle, therefore use kotlin-dsl
      `kotlin-dsl`
  }
  ```

---

## Registering the Custom Task

```kt
// settings.gradle.kts
includeBuild("./build-logic")
```

```kt
buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath(":build-logic")
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
* If a task is run for a second time and its inputs and outputs haven't changed, it is not re-run
* Similarly, if a task depends on the output of another task which has not changed, it is not re-run
* This means that tasks should not modify the same file as others, or you will lose caching; instead each task should generate a separate file

---

## Task Dependencies & Lifecycle Tasks

* Some tasks don't have an implementation; they are used to group other tasks together; these are called lifecycle tasks
* To add a task to a lifecycle, use **dependsOn**
* If you need to manually order them, use **mustRunAfter** or **finalizedBy**

    ```kt
    tasks.register<MyTask>("myTask") {
        dependsOn("build") 
        mustRunAfter("helloWorldTask")
        finalizedBy("deleteTmpFiles")
    }
    ```
* There's a better way to do this though
---

## Depending on Outputs

* Instead, we can depend on outputs of certain tasks to automatically order them correctly
     ```kt
    tasks.register<MyTask2>("myTask2") {
        myInput = tasks.named<MyTask>("myTask").flatMap{ it.outputFile }
    }
    ```

---

## Changing Existing Tasks

* Many tasks are registered with default values and can be configured by fetching them either by type or name

  ```kt
  tasks.withType<Test> {
      jvmArgs.add("-javaagent:${mockitoAgent.asPath}")
  }
  
  tasks.named<Test>("test") {
      useJUnitPlatform {
        includeTags("unit", "integration", "migration")
      }
  }
  ```

---

## Plugins

* Plugins usually ship collections of tasks, provide a configuration block
* They go into the plugins block

  ```kt
  plugins {
      id("com.github.ben-manes.versions") version "1.0"
  }
  ```

* You don't need to specify an artifact because it automatically defaults to
  ```kt 
  "$id.gradle.plugin:$version" 
  ```
---

## Custom Plugin - Build Files

* Similar to our custom task, we need to create our build files in a folder, e.g. **my-plugin/**

  ```kt
  // my-plugin/settings.gradle.kts
  rootProject.name = "my-plugin"
  ```
  
  ```kt
  // my-plugin/build.gradle.kts
  repositories {
      mavenCentral()
  }
  
  plugins {
      `kotlin-dsl`
  }
  ```

* If you want to publish your plugin instead of keeping it in your repository, [you need a gradlePlugin block](https://docs.gradle.org/current/userguide/preparing_to_publish.html#sec:minimum_configuration), version and group as well

---

## Custom Plugin - Registering

* Similar to our Composite Build example, we need to include it in our **settings.kts.file**
  
  ```kt
  includeBuild("./my-plugin")
  ```

* But this time, we don't need the buildScript block; instead we can use the plugin shortcut
  
  ```kt
  plugins {
      id(":my-plugin")
  }
  ```

---

## Custom Plugin - Usage

* We want a plugin that makes an HTTP call and configure it like this

  ```kt
  restCall {
      location = "https://api.com/"
      fileToUpload = layout.buildDirectory.file("test.txt")
  }
  ```

* The plugin should automatically run after our build (so after assemble)

---

## Custom Plugin - Configuration

* All values that can be configured on a plugin need to be specified using an interface
* You can define default values using the **convention** method

  ```kt
  // my-plugin/src/main/kotlin/at/fyayc/myplugin/MyPluginExtension.kt
  abstract class MyPluginExtension @Inject constructor(
      objects: ObjectFactory, 
      projectLayout: ProjectLayout
  ) {
      val fileToUpload: RegularFileProperty = objects.fileProperty()
          .convention(projectLayout.buildDirectory.file("test.txt"))
      val location: Property<String> = objects.property(String::class.java)
  }
  ```

---

## Custom Plugin - Task

```kt
// my-plugin/src/main/kotlin/at/fyayc/tasks/UploadTask.kt
abstract class UploadTask: DefaultTask() {
    @get:Input
    abstract val location: Property<String>

    @get:InputFile
    abstract val file: RegularFileProperty

    @TaskAction
    fun exec() {
        val theFile = file.get()
        val url = URI(location.get())
        // etc
    }
}
```
---

## Custom Plugin - Wiring it up

```kt
// my-plugin/src/main/kotlin/at/fyayc/myplugin/MyPlugin.kt
abstract class MyPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val extension = project.extensions.create(
          "restCall", 
          MyPluginExtension::class.java
        )
        project.tasks.register<UploadTask>("uploadTask") {
            dependsOn("assemble")
            mustRunAfter("assemble")
            file.convention(extension.fileToUpload)
            url.convention(extension.location)
        }
    }
}
```

---

## Convention Plugins

* We can create plugins from sections of a **build.gradle.kts** as well
* Those are called [Convention Plugins](https://docs.gradle.org/current/userguide/implementing_gradle_plugins_convention.html)
* They also need to be included using **includeBuild** like every other composite build plugin and need their own **settings.gradle.kts** and **build.gradle.kts**
* The only difference is the file name and inclusion mechanism

---

## Convention Plugin - Configure Defaults

```kt
// build-logic/src/main/kotlin/at/fyayc/common-conventions.gradle.kts
package at.fyayc

plugins {
  jacoco
  id("com.github.ben-manes.versions")
}
```

Include with:

```kt
// settings.gradle.kts
includeBuild("./build-logic")

// build.gradle.kts
plugins {
	id("at.fyayc.common-conventions")
}
```

---
## Convention Plugin - Build Scripts

```kt
// build-logic/build.gradle.kts
plugins {
  `kotlin-dsl`
}
repositories {
  gradlePluginPortal()
  mavenCentral()
}
// plugins need to be added as dependencies first
dependencies {
  implementation(libs.plugins.versions.toDependency())
}
// see https://github.com/gradle/gradle/issues/17963#issuecomment-939207895
fun Provider<PluginDependency>.toDependency(): String {
  val t = get()
  val id = t.pluginId
  return "$id:$id.gradle.plugin:${t.version}"
}
```

---

## Dependencies

* Dependencies are marked up in the **build.gradle.kts**
    ```kt
    dependencies {
        implementation("com.google.guava:guava:32.1.2-jre") 
        api("org.apache.juneau:juneau-marshall:8.2.0")      
    }
    ```
* Multiple methods:
  * **Implementation**: Compile and run but do not expose to modules depending on this module during compilation
  * **API**: Same as implementation but also expose dependencies
  * **testImplementation**: Same as implementation but only for tests
  * **compileOnly**: Only needed to compile, e.g. compiler plugins
  * **runtimeOnly**: Only needed at runtime, not included during compilation; allows consumer of library to swap it out

---

## Build Dependencies

* Sometimes you need to declare dependencies for the Gradle build itself 
* These go into the **buildScript** block, **unless you are writing code that is to be used by a Gradle task/plugin** 

  ```kt
  buildscript {
      repositories {
          mavenCentral()
          yourPluginRegistry()
      }
      dependencies {
          classpath("com.android.tools.build:gradle:3.4.2")
      }
  }
  ```

* Usually, you don't need this because you use the plugin mechanism 

---

## Sharing Dependencies

* You can externalize dependencies into **gradle/libs.versions.toml**
    ```toml
    [versions]
    kotlin = "2.4.0"
    
    [libraries]
    junit-kotlin = { module = "org.jetbrains.kotlin:kotlin-test-junit", 
        version.ref = "kotlin" }
    kotlinx-datetime = { module = "org.jetbrains.kotlinx:kotlinx-datetime", 
        version = "0.8.0" }
    
    [plugins]
    kotlin-multiplatform = { id = "org.jetbrains.kotlin.multiplatform",
        version.ref = "kotlin" }
    ```
---

## Including Shared Dependencies 

* Then use them in **build.gradle.kts** like this:
    ```kt
    plugins {
        alias(libs.plugins.kotlin.multiplatform)
    }
    
    dependencies {
        implementation(libs.junit.kotlin)
        implementation(libs.kotlinx.datetime)
    }
    ```

* Different location configured in **settings.gradle.kts**

    ```kt
    dependencyResolutionManagement {
        versionCatalogs {
            create("libs") {
                from(files("../libs.versions.toml"))
            }
        }
    }
    ```

---

## Generating Code at Build Time

* Since you define task outputs, you can just append those to resources or code during build time to your existing code base

  ```kt
  // build.gradle.kts
  val task = tasks.register<GenerateSomeCode>("generate code") {
      // etc
  }
  
  kotlin {
      sourceSets {
        main {
          kotlin {
            srcDir(task)
          }
        }
      }
  }
  ```

---

## Multi-Project Builds

* What if we wanted to split up a project into several modules (e.g. atscore, atsfacades, atswebservices)
* Gradle supports this using modules
* Differences from Composite Builds: 
  * **include()** rather than **includeBuild()**
  * no separate **settings.gradle.kts**
  * Composite Builds are separate artifacts that can stand on their own (e.g. 2 different webservices)
  * Modules 

---

## Multi-Project Builds - Layout
```kt
rootProject.name = "dependencies-java"
include("api", "shared", "services:person-service")
```
```
.
├── api
│   ├── src
│   │   └──...
│   └── build.gradle.kts
├── services
│   └── person-service
│       ├── src
│       │   └──...
│       └── build.gradle.kts
├── shared
│   ├── src
│   │   └──...
│   └── build.gradle.kts
└── settings.gradle.kts
```

---

## Multi-Project Builds - Dependencies

* The project helper can be used to reference sub folders

```kt
dependencies {
    implementation(project(":shared"))
}
```
---
## Questions