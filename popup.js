// Some util functions 
function isAcceptedUrl(url) {
    return (url.startsWith("https://www.linkedin.com/jobs/view/")
        || url.startsWith("https://www.glassdoor.com/job-listing/")
        || url.startsWith("https://www.indeed.com/viewjob?")
    );
};

// Set the OpenAI API Key 
chrome.storage.local.get(['openai_api_key'], (result) => {
    if (result.openai_api_key) {
        document.getElementById("input_openai_api_key").value = result.openai_api_key;
    }
});

// Set the save openai api key save button 
document.getElementById("save_openai_api_key").addEventListener('click', () => {
    chrome.storage.local.set({ openai_api_key: document.getElementById('input_openai_api_key').value.trim() }, () => { });
});

// Set expanding/collapsing openai api key section 
document.getElementById("div_header_openai_api_key").addEventListener('click', () => {
    let iconHeaderOpenaiApiKey = document.getElementById("icon_header_openai_api_key"); 
    let divHeaderOpenaiApiKey = document.getElementById("div_header_openai_api_key"); 
    let divContentOpenaiApiKey = document.getElementById("div_content_openai_api_key"); 

    let currentStatus = divHeaderOpenaiApiKey.getAttribute("class"); 
    if (currentStatus == "div-indicates-expanded") {
        iconHeaderOpenaiApiKey.setAttribute("class", "fa-solid fa-caret-up"); 
        divHeaderOpenaiApiKey.setAttribute("class", "div-indicates-collapsed"); 
        divContentOpenaiApiKey.setAttribute("class", "div-content-collapsed"); 
    }
    else if (currentStatus == "div-indicates-collapsed") {
        iconHeaderOpenaiApiKey.setAttribute("class", "fa-solid fa-caret-down"); 
        divHeaderOpenaiApiKey.setAttribute("class", "div-indicates-expanded"); 
        divContentOpenaiApiKey.setAttribute("class", "div-content-expanded"); 
    }
    else {
        console.error("Invalid class of div_header_openai_api_key: ", currentStatus); 
    }
}); 

// Set the user questions 
chrome.storage.local.get(['user_questions'], (result) => {
    if (result.user_questions) {
        document.getElementById("textarea_user_questions").value = result.user_questions;
    }
});

// Set expanding/collapsing the user question section 
document.getElementById("div_header_user_questions").addEventListener('click', () => {
    let iconHeaderUserQuestions = document.getElementById("icon_header_user_questions"); 
    let divHeaderUserQuestions = document.getElementById("div_header_user_questions"); 
    let divContentUserQuestions = document.getElementById("div_content_user_questions"); 

    let currentStatus = divHeaderUserQuestions.getAttribute("class"); 
    if (currentStatus == "div-indicates-expanded") {
        iconHeaderUserQuestions.setAttribute("class", "fa-solid fa-caret-up"); 
        divHeaderUserQuestions.setAttribute("class", "div-indicates-collapsed"); 
        divContentUserQuestions.setAttribute("class", "div-content-collapsed"); 
    }
    else if (currentStatus == "div-indicates-collapsed") {
        iconHeaderUserQuestions.setAttribute("class", "fa-solid fa-caret-down"); 
        divHeaderUserQuestions.setAttribute("class", "div-indicates-expanded"); 
        divContentUserQuestions.setAttribute("class", "div-content-expanded"); 
    }
    else {
        console.error("Invalid class of div_header_user_questions: ", currentStatus); 
    }
});

// Set the save user question button 
document.getElementById("save_user_questions").addEventListener('click', () => {
    chrome.storage.local.set({ user_questions: document.getElementById('textarea_user_questions').value.trim() }, () => { });
});

// Set the go analyzing button 
document.getElementById("go_analyzing").addEventListener('click', () => {
    let openaiApiKey = document.getElementById("input_openai_api_key").value.trim();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const pageUrlAsStorageKey = tabs[0].url;

        if (isAcceptedUrl(pageUrlAsStorageKey)) {
            chrome.storage.local.get([pageUrlAsStorageKey, "user_questions"], (result) => {
                let jobInfo = result[pageUrlAsStorageKey];

                let llmPrompt = `I am hunting for my next job. I found a job description, and I have several questions of it. \nHere are the questions: \n${result.user_questions} \n\nAnswer the questions by first repeating the question and then the short respond. Answer the questions shortly but concisely based on the following job description: \n${jobInfo.job_title} -- ${jobInfo.job_description} `;
                console.log(`[LLM Prompt] ${llmPrompt}`);

                if (jobInfo) {
                    fetch(
                        "https://api.openai.com/v1/chat/completions",
                        {
                            "method": "POST",
                            "headers": {
                                "Content-type": "application/json",
                                "Authorization": `Bearer ${openaiApiKey}`
                            },
                            "body": JSON.stringify({
                                "model": "gpt-3.5-turbo",
                                "messages": [
                                    {
                                        "role": "user",
                                        "content": llmPrompt
                                    }
                                ]
                            })
                        }
                    )
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('OpenAI response was not ok');
                            }
                            return response.json();
                        })
                        .then(jsonData => {
                            let llmAnswers = jsonData.choices[0].message.content;
                            llmAnswers = llmAnswers.replace(/(\d+)\./g, '\n$1.');
                            llmAnswers = llmAnswers.replace(/(\n+)/g, '\n');
                            llmAnswers = llmAnswers.trim();
                            llmAnswers = llmAnswers.replace(/\n/g, '<br/><br/>');
                            document.getElementById("span_llm_answers").innerHTML = llmAnswers;
                        })
                        .catch(error => {
                            console.error('Error on calling OpenAI:', error);

                        });
                }
            });
        }
    });
});

// Periodically update popup for the job info
function updateJobInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const pageUrlAsStorageKey = tabs[0].url;

        if (isAcceptedUrl(pageUrlAsStorageKey)) {
            chrome.storage.local.get([pageUrlAsStorageKey], (result) => {
                let jobInfo = result[pageUrlAsStorageKey];
                document.getElementById("span_job_title").textContent = jobInfo.job_title;
                document.getElementById("span_job_description").textContent = jobInfo.job_description;
            });
        }
    });
}

setInterval(updateJobInfo, 1000);

// Periodically remove the old entries from chrome.storage.local 
function removeOldStorageEntry() {
    console.log("Cleaning up chrome.storage.local...");

    chrome.storage.local.get(null, (items) => {
        let nowTime = Date.now();

        // Delete entries with keys starting with "temp_"
        let keysToDelete = [];
        for (const key in items) {
            if (isAcceptedUrl(key)) {
                let jobInfo = items[key];
                if (!jobInfo.hasOwnProperty("timestamp") || (nowTime - jobInfo.timestamp) > 3600000) {
                    keysToDelete.push(key);
                }
            }
        }

        console.log(`${keysToDelete.length} entries to be deleted...`);

        // Update storage with modified entries
        chrome.storage.local.remove(keysToDelete, (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error removing item from storage:", chrome.runtime.lastError.message);
            }
        });
    });

};

setInterval(removeOldStorageEntry, 5000); 