/* 
Function for extrating job title and description from a LinkedIn URL
*/
function extractLinkedInJobInfo() {
    let innerHtmlString = document.documentElement.innerHTML;
    let innerHtmlDom = document.createElement('div');
    innerHtmlDom.innerHTML = innerHtmlString;

    let codeElements = innerHtmlDom.getElementsByTagName("code");

    let job_title = "";
    let job_description = "";

    for (let i = 0; i < codeElements.length; i++) {
        let codeText = codeElements[i].textContent;
        try {
            let codeObj = JSON.parse(codeText);
            let jobTitle = codeObj["data"]["title"];
            let jobDesc = codeObj["data"]["description"]["text"];

            job_title = `${job_title}\n\n${jobTitle}`.trim();
            job_description = `${job_description}\n\n${jobDesc}`.trim();
        } catch (Error) { }
    }

    let storageKey = window.location.href;
    let timestamp = Date.now(); 
    let jobInfo = { job_title, job_description, timestamp };

    let storageEntry = {};
    storageEntry[storageKey] = jobInfo;

    console.log(storageEntry);

    if (job_title.trim() !== "" && job_description.trim() !== "") {
        chrome.storage.local.set(storageEntry, () => { });
    }
}


/* 
Function for extrating job title and description from a Glassdoor URL
*/
function extractGlassdoorJobInfo() {
    let innerHtmlString = document.documentElement.innerHTML;
    let innerHtmlDom = document.createElement('div');
    innerHtmlDom.innerHTML = innerHtmlString;

    let divElements = innerHtmlDom.getElementsByTagName("div");

    let job_title = "";
    let job_description = "";

    function extractAllElementText(elem) {
        let textContent = "";
        if (elem.nodeType === Node.TEXT_NODE) {
            textContent = `${textContent}\n${elem.textContent.trim()}`;
        } else if (elem.nodeType === Node.ELEMENT_NODE) {
            for (let i = 0; i < elem.childNodes.length; i++) {
                textContent = `${textContent}\n${extractAllElementText(elem.childNodes[i])}`;
            }
        }
        return textContent; 
    }

    for (let i = 0; i < divElements.length; i++) {
        try {
            let divElem = divElements[i];
            let divClass = divElem.getAttribute("class");

            if (divClass.startsWith("JobDetails_jobDetailsHeader__")) {
                job_title = extractAllElementText(divElem);
            }
            else if (divClass.startsWith("JobDetails_jobDescription__")) {
                job_description = extractAllElementText(divElem); 
            }
        } catch (Error) { }
    }

    job_title = job_title.trim(); 
    job_title = job_title.replace(/\n+/g, "\n"); 
    job_description = job_description.trim(); 
    job_description = job_description.replace(/\n+/g, "\n");

    let storageKey = window.location.href;
    let timestamp = Date.now(); 
    let jobInfo = { job_title, job_description, timestamp};

    let storageEntry = {};
    storageEntry[storageKey] = jobInfo;

    console.log(storageEntry);

    if (job_title.trim() !== "" && job_description.trim() !== "") {
        chrome.storage.local.set(storageEntry, () => { });
    }
}


/* 
Function for extrating job title and description from a Glassdoor URL
*/
function extractIndeedJobInfo() {
    let innerHtmlString = document.documentElement.innerHTML;
    let innerHtmlDom = document.createElement('div');
    innerHtmlDom.innerHTML = innerHtmlString;

    let divElements = innerHtmlDom.getElementsByTagName("div");

    let job_title = "";
    let job_description = "";

    function extractAllElementText(elem) {
        let textContent = "";
        if (elem.nodeType === Node.TEXT_NODE) {
            textContent = `${textContent}\n${elem.textContent.trim()}`;
        } else if (elem.nodeType === Node.ELEMENT_NODE) {
            for (let i = 0; i < elem.childNodes.length; i++) {
                textContent = `${textContent}\n${extractAllElementText(elem.childNodes[i])}`;
            }
        }
        return textContent; 
    }

    for (let i = 0; i < divElements.length; i++) {
        try {
            let divElem = divElements[i];
            let divClass = divElem.getAttribute("class");

            if (divClass.startsWith("jobsearch-JobInfoHeader-title-container")) {
                job_title = extractAllElementText(divElem);
            }
            else if (divClass.startsWith("jobsearch-JobComponent-description")) {
                job_description = extractAllElementText(divElem); 
            }
        } catch (Error) { }
    }

    job_title = job_title.trim(); 
    job_title = job_title.replace(/\n+/g, "\n"); 
    job_description = job_description.trim(); 
    job_description = job_description.replace(/\n+/g, "\n");

    let storageKey = window.location.href;
    let timestamp = Date.now(); 
    let jobInfo = { job_title, job_description, timestamp};

    let storageEntry = {};
    storageEntry[storageKey] = jobInfo;

    console.log(storageEntry);

    if (job_title.trim() !== "" && job_description.trim() !== "") {
        chrome.storage.local.set(storageEntry, () => { });
    }
}


/*
Even listener for tab URL changed 
*/
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.toString().startsWith("http")) {
        let tabUrl = tab.url.toString();

        if (tabUrl.startsWith("https://www.linkedin.com/jobs/view/")) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: extractLinkedInJobInfo
            });
        }
        else if (tabUrl.startsWith("https://www.glassdoor.com/job-listing/")) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: extractGlassdoorJobInfo
            });
        }
        else if (tabUrl.startsWith("https://www.indeed.com/viewjob?")) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: extractIndeedJobInfo
            });
        }
    }
});

