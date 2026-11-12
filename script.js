
(() => {
  // Mobile navigation
  const menu = document.getElementById('menu');
  const nav = document.getElementById('nav');

  if (menu && nav) {
    menu.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Footer year
  const year = document.getElementById('year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Homepage demonstration stories
  const stories = {
    contracts: [
      'Following the Money: How to Examine Federal Contracts',
      'This demonstration article outlines a potential reporting workflow: identify federal contract awards using public procurement data, examine spending and audit records, request supporting documents, and interview subject-matter experts and affected communities. No specific contract, official, or wrongdoing is alleged.'
    ],
    policy: [
      'From Proposal to Law: Tracking Policy Decisions',
      'This demonstration article describes how a future Ivy League Press reporter could follow a bill from introduction to committee hearings, amendments, votes, and implementation. A finished article would include primary-source links, verified quotes, and perspectives from affected stakeholders.'
    ],
    records: [
      'Inside the Public Records Process',
      'This demonstration article introduces the Freedom of Information Act and public records research. A real investigation would document requests, independently verify any records received, and offer subjects a fair opportunity to respond before publication.'
    ]
  };

  const dialog = document.getElementById('storyDialog');
  const closeDialog = document.getElementById('closeDialog');
  const dialogTitle = document.getElementById('dialogTitle');
  const dialogText = document.getElementById('dialogText');

  if (dialog && closeDialog && dialogTitle && dialogText) {
    document.querySelectorAll('[data-story]').forEach(button => {
      button.addEventListener('click', () => {
        const story = stories[button.dataset.story];

        if (!story) return;

        dialogTitle.textContent = story[0];
        dialogText.textContent = story[1];
        dialog.showModal();
      });
    });

    closeDialog.addEventListener('click', () => {
      dialog.close();
    });

    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  }
})();
