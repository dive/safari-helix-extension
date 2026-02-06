const title = browser.i18n.getMessage("extension_name");

if (title) {
    document.getElementById("title").textContent = title;
    document.title = title;
}
