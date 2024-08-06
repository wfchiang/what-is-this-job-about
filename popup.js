
// Set the OpenAI API Key 
chrome.storage.local.get(['openai_api_key'], (result) => {
    if (result.openai_api_key) {
        document.getElementById("input_openai_api_key").value = result.openai_api_key;
    }
});

// Set the save openai api key save and reset buttons 
document.getElementById("save_openai_api_key").addEventListener('click', () => {
    chrome.storage.local.set({ openai_api_key: document.getElementById('input_openai_api_key').value.trim() }, () => { });
});

document.getElementById("reset_openai_api_key").addEventListener('click', () => {
    document.getElementById('input_openai_api_key').removeAttribute("value");
    chrome.storage.local.set({ openai_api_key: undefined }, () => { });
});

// Set the go analyzing button 
document.getElementById("go_analyzing").addEventListener('click', () => {
    let openaiApiKey = document.getElementById("input_openai_api_key").value.trim();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const pageUrl = tabs[0].url;

        if (pageUrl.startsWith("https://www.linkedin.com/jobs/view/")) {
            let jobId = pageUrl.slice("https://www.linkedin.com/jobs/view/".length);
            jobId = jobId.slice(0, jobId.indexOf("/"));
            jobId = `linkedin_job_${jobId}`; 

            chrome.storage.local.get([jobId], (result) => {
                console.log(result); 
    
                if (result[jobId]) {
                    console.error(`Job description: ${openaiApiKey} -- ${result[jobId].job_title} -- ${result[jobId].job_description}`);
                }
            });
        }
    });
});
