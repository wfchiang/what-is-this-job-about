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

// Set the user questions 
chrome.storage.local.get(['user_questions'], (result) => {
    if (result.user_questions) {
        document.getElementById("textarea_user_questions").value = result.user_questions;
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

        if (pageUrlAsStorageKey.startsWith("https://www.linkedin.com/jobs/view/")) {
            chrome.storage.local.get([pageUrlAsStorageKey, "user_questions"], (result) => {
                let jobInfo = result[pageUrlAsStorageKey];

                let llmPrompt = `I am hunting for my next job. I found a job description, and I have several questions of it. \nHere are the questions: \n${result.user_questions} \n\nPlease concisely answer the questions based on the following job description: \n${jobInfo.job_title} -- ${jobInfo.job_description} `; 
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

        if (pageUrlAsStorageKey.startsWith("https://www.linkedin.com/jobs/view/")) {
            chrome.storage.local.get([pageUrlAsStorageKey], (result) => {
                let jobInfo = result[pageUrlAsStorageKey];
                document.getElementById("span_job_title").textContent = jobInfo.job_title;
                document.getElementById("span_job_description").textContent = jobInfo.job_description;
            });
        }
    });
}

setInterval(updateJobInfo, 1000);