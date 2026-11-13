(() => {
  const selectors = [".signup-form", ".contact-form", ".apply-form"];
  const forms = selectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
  if (!forms.length) return;

  const dialog = document.createElement("dialog");
  dialog.className = "form-success-dialog";
  dialog.setAttribute("aria-labelledby", "form-success-title");
  dialog.innerHTML = '<div class="form-success-dialog__header"><div class="form-success-dialog__check" aria-hidden="true">✓</div><h2 id="form-success-title">Success!</h2></div><div class="form-success-dialog__body"><p>Your response has been submitted successfully. Thank you for contacting Georbit.</p><div class="form-success-dialog__actions"><button type="button" class="form-success-dialog__close">Close</button><button type="button" class="form-success-dialog__continue">Continue browsing</button></div></div>';
  document.body.append(dialog);

  let refreshTimer;
  dialog.querySelector(".form-success-dialog__close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".form-success-dialog__continue").addEventListener("click", () => {
    window.clearTimeout(refreshTimer);
    dialog.close();
  });

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (dialog.open) return;
      dialog.showModal();
      dialog.querySelector(".form-success-dialog__close").focus();
      refreshTimer = window.setTimeout(() => window.location.reload(), 4000);
    });
  });
})();
