console.log("Helper Ai");

// helper function to debounce function calls
function debounce(func, delay) {
  let inDebounce;
  return function () {
    let context = this;
    let args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
}

// regex to check the text is in the form "help: command;"
let getTextParsed = (text) => {
  let parsed = /help:(.*?)\;/gi.exec(text);
  return parsed ? parsed[1] : "";
};

// helper function to get the nodes, extract their text
let getTextContentFromDOMElements = (nodes, textarea = false) => {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  for (let node of nodes) {
    let value = textarea ? node.value : node.textContent;
    if (node && value) {
      let text = getTextParsed(value);
      if (text) return [node, text];
      else return null;
    }
  }
};

// function to find the text on active tab
let scrapText = () => {
  let ele = document.querySelectorAll('[contenteditable="true"]');
  let parsedValue = getTextContentFromDOMElements(ele);
  if (parsedValue) {
    let [node, text] = parsedValue;
    makeChatGPTCall(text, node);
  }
};

// debounced function call
let debouncedScrapText = debounce(scrapText, 1000);

// observe what the user is typing
window.addEventListener("keypress", debouncedScrapText);

// function to make the GPT call
let makeChatGPTCall = async (text, node) => {
  try {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer Your Key");

    // set request payload
    let raw = JSON.stringify({
      model: "text-davinci-003",
      prompt: text,
      max_tokens: 2048,
      temperature: 0,
      top_p: 1,
      n: 1,
      stream: false,
      logprobs: null,
    });

    // set request options
    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    // make the api call
    let response = await fetch(
      "https://api.openai.com/v1/completions",
      requestOptions
    );
    response = await response.json();
    let { choices } = response;

    // remove the spaces from the reponse text
    let responseText = choices[0].text.replace(/^\s+|\s+$/g, "");
    if (responseText) {
      // format the response for better readability
      responseText = responseText
        .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
        .split("|")
        .join(".\n\n");
      responseText = responseText.replace(/\n([^\n])/g, "\n $1");

      // populate the node with the response
      node.textContent = responseText;
    }
  } catch (e) {
    console.error("Error while calling openai api", e);
  }
};
