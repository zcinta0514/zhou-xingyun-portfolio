(function () {
  const root = document.getElementById('capabilities');
  const buttons = [...root.querySelectorAll('[data-capability]')];
  const panels = [...root.querySelectorAll('[data-panel-v2]')];
  function select(button) {
    const id = button.dataset.capability;
    buttons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      const active = panel.dataset.panelV2 === id;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
    root.querySelectorAll('[data-case-v2]').forEach(chip => chip.classList.toggle('match', chip.dataset.caseV2.split(' ').includes(id)));
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      select(buttons[next]);
      buttons[next].focus();
    });
  });
}());
