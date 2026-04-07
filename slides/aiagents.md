class: center, middle

# Assisted AI Agent Workflows

---

## AI-Based Flows

* Does not guarantee correctness
* Asking a magic 8-Ball
* Requires oversight and guidance in all steps
* Great when incorrect results are not an issue and the only requirement is getting good enough results that would be difficult to specify in code
* Think virus scanners using heuristics to determine if a file is a virus rather than checksums: high rate of false positives but likely to also detect unknown threats

---

## Complementing AI Agents

* 100% autonomous AI is not yet possible
* **Oversight**: checkpoints where human intervention is required
* **Correctness**: custom code that can be used by the model to trigger code
* **Benefit**: If required, can be pulled out of an AI Agent workflow 

---

## Building Workflows Using Kotlin & Koog

Pull in the koog library in a new Kotlin & Gradle project and configure an API key, e.g. through an env variable. Many popular cloud service can be used, but also local LLM instances like Ollama

```sh
export GOOGLE_AI_API_KEY=your-api-key
```

```kt
dependencies {
    implementation("ai.koog:koog-agents:0.7.3")
}
```

---

## Simple Agent Call

```kt
suspend fun main() {
    val agent = AIAgent(
        promptExecutor = simpleGoogleAIExecutor(System.getenv("GOOGLE_AI_API_KEY")),
        systemPrompt = "You are a waiter at a Michelin starred restaurant",
        llmModel = GoogleModels.Gemini2_5Flash,
    )

    print(agent.run("Waiter, please tell me your name"))
    // I am a large language model, I do not have a name. 
    // How may I help you this evening?
}
```

---

## Giving a Helping Hand: Tools

* Used to give the AI agent a callback that they can execute
* Can implement anything starting from reading files to requiring user interaction
* Can receive parameters from the AI agent through annotations
* Can cut down on context size by providing a filtered answer
* Can query web services such as Google Maps or execute web requests using Selenium
* Buch of predefined tools like asking users or reading/writing to files

---

## Wine Card Example (1/2)

```kt
data class Wine(val label: String, val year: Int, val stars: Int)

val wineCard = listOf(
    Wine(label = "Chateau Neuf", year = 2002, stars = 3),
    Wine(label = "Chateau Huit", year = 2003, stars = 4),
    Wine(label = "Chateau Sept", year = 2004, stars = 1),
)
```

---


## Wine Card Example (2/2)

```kt
class WineCardTool : ToolSet {
    @Tool
    @LLMDescription("Holds all available wines that can be offered to the customer")
    fun fetchWineList(): String {
        return markdown {
            h1("Wine Card")
            bulleted {
                wineCard.forEach {
                    item {
                        +"* ${it.label}: stars: ${it.stars}, year: ${it.year}"
                    }
                }
            }
        }
    }
}
```

---

## Registering Tools

```kt
suspend fun main() {
    // create http client
    val agent = AIAgent(
        promptExecutor = simpleGoogleAIExecutor(System.getenv("GOOGLE_AI_API_KEY")),
        systemPrompt = "You are a waiter at a Michelin starred restaurant",
        llmModel = GoogleModels.Gemini2_5Flash,
        toolRegistry = ToolRegistry {
            tools(WineCardTool())
        },
    )

    print(agent.run("Waiter, what is the best wine that you can recommend me from your winecard"))
    // From our wine card, I would recommend the Chateau Huit, with 4 stars from the year 2003. It is an excellent choice.
}
```

---

## Tool Parameters

We can also let the LLM pass parameters to the tool itself, but we need to explain the parameters using annotations

```kt
class WineCardTool : ToolSet {
    @Tool
    @LLMDescription("Holds all available wines that can be offered to the customer")
    fun fetchWineList(
        @LLMDescription("The year in which the wine was harvested")
        year: Int
    ): String {
        // ...
    }
}
```

---

## Flows

* You can define AI agent flows using Strategies
* Each Strategy defines input and output types (both String, String here)
* First we define actions/nodes by using Kotlin delegates (aka interceptors for getting/setting a variable), then we connect them using edges

---

## Simple Flow

* **onAssistantMessage { true }** evaluates to

```kt
onCondition { it is Message.Assistant } transformed {
    it.asAssistantMessage().content 
}
```

```kt
val flow = strategy<String, String>("Sends and Receives Message") {
    val nodeSendInput by nodeLLMRequest()

    edge(nodeStart forwardTo nodeSendInput)
    edge(nodeSendInput forwardTo nodeFinish onAssistantMessage { true })
}
```

![](../img/aiagents/simple.png)

---

## Registering and Triggering Flows

```kt
val agent = AIAgent<String, String>(
    promptExecutor = simpleGoogleAIExecutor(System.getenv("GOOGLE_AI_API_KEY")),
    systemPrompt = "You are a waiter at a Michelin starred restaurant",
    llmModel = GoogleModels.Gemini2_5Flash,
    strategy = flow,
)
val result = agent.run("String passed to nodeStart node")
```

---

## A More Complex Flow

---

## Custom Nodes 

---

## File Uploads

* Working with structured input/output is more complex and needs to be done using prompts
* Files can be retrieved from the response looking at response.parts instead of response.content

```kt
val request = prompt("id here") {
    user {
        +"Explain what's in the following image"
        image("/path/to/image.jpg")
    }
}
```

---

## File Downloads

Remember **it.asAssistantMessage().content**? 

Each Response has a parts property which holds all text and files: 

```kt
public sealed interface Message {
    public val content: String
        get() = parts.filterIsInstance<ContentPart.Text>()
            .joinToString(separator = "\n") { it.text }
}
```

---

## Additional Features

* **Long and Short Term Memory**: Load previous conversations by session id or from a predefined location
* **Tracing & Logging**: Custom hooks to log LLM responses and requests
* **State Restore**: Restore state from a node from a previous execution