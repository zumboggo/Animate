/** Dropdown listing every .story file found in stories/. */
export function createStoryPicker(
  storyNames: string[],
  current: string,
  onSelect: (name: string) => void,
): HTMLSelectElement {
  const select = document.createElement('select');
  select.title = 'Choose a story';
  for (const name of storyNames) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = `📖 ${name}`;
    if (name === current) option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener('change', () => onSelect(select.value));
  return select;
}
