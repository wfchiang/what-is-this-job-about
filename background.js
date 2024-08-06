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

    let pageUrl = window.location.href;
    let jobId = pageUrl.slice("https://www.linkedin.com/jobs/view/".length);
    jobId = jobId.slice(0, jobId.indexOf("/"));
    jobId = `linkedin_job_${jobId}`; 
    let jobInfo = { job_title, job_description };

    let storageEntry = {};
    storageEntry[jobId] = jobInfo;

    console.log(storageEntry);

    if (job_title.trim() !== "" && job_description.trim() !== "") {
        chrome.storage.local.set(storageEntry, () => { });
    }
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.toString().startsWith("http")) {
        let tabUrl = tab.url.toString();

        if (tabUrl.startsWith("https://www.linkedin.com/jobs/view/")) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: extractLinkedInJobInfo
            });
        }
    }
});

