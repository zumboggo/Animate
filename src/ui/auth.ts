import type { User } from '@supabase/supabase-js';
import { DEFAULT_STORY_MODEL, STORY_MODELS } from '../ai/openRouter';
import {
  authErrorFromUrl,
  getAuthState,
  isSupabaseConfigured,
  onAuthChange,
  sendMagicLink,
  signInWithGoogle,
  signOut,
} from '../auth/supabase';
import { getAiSettings, saveAiSettings } from '../auth/userSettings';

/** Builds the header account control and modal sign-in experience. */
export function buildAuth(parent: HTMLElement): void {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'auth-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');

  const dialog = document.createElement('dialog');
  dialog.className = 'auth-dialog';
  dialog.setAttribute('aria-labelledby', 'auth-title');
  const card = document.createElement('div');
  card.className = 'auth-card';
  dialog.appendChild(card);
  document.body.appendChild(dialog);

  let currentUser: User | null = null;
  let busy = false;
  let message = authErrorFromUrl();

  const open = () => {
    renderDialog();
    dialog.showModal();
  };

  trigger.addEventListener('click', open);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  parent.appendChild(trigger);

  const renderTrigger = () => {
    trigger.innerHTML = '';
    if (!currentUser) {
      const icon = document.createElement('span');
      icon.className = 'auth-person-icon';
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = 'Sign in';
      trigger.append(icon, label);
      trigger.setAttribute('aria-label', 'Sign in to Story Sprout');
      return;
    }

    const avatar = document.createElement('span');
    avatar.className = 'auth-avatar';
    avatar.textContent = userInitial(currentUser);
    const copy = document.createElement('span');
    copy.className = 'auth-trigger-copy';
    const name = document.createElement('strong');
    name.textContent = userName(currentUser);
    const account = document.createElement('small');
    account.textContent = 'My account';
    copy.append(name, account);
    trigger.append(avatar, copy);
    trigger.setAttribute('aria-label', `Open account for ${currentUser.email ?? userName(currentUser)}`);
  };

  const renderDialog = () => {
    card.innerHTML = '';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'auth-close';
    close.setAttribute('aria-label', 'Close sign in');
    close.textContent = '×';
    close.addEventListener('click', () => dialog.close());

    const sprout = document.createElement('div');
    sprout.className = 'auth-sprout';
    sprout.innerHTML = '<i></i><i></i>';
    const title = document.createElement('h2');
    title.id = 'auth-title';

    card.append(close, sprout, title);

    if (currentUser) {
      title.textContent = 'Your Story Sprout account';
      const intro = document.createElement('p');
      intro.textContent = 'You are signed in. Your session will stay active on this device.';
      const account = document.createElement('div');
      account.className = 'signed-in-account';
      const avatar = document.createElement('span');
      avatar.className = 'auth-avatar large';
      avatar.textContent = userInitial(currentUser);
      const details = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = userName(currentUser);
      const email = document.createElement('span');
      email.textContent = currentUser.email ?? 'Signed-in account';
      details.append(name, email);
      account.append(avatar, details);
      const logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'auth-secondary-button';
      logout.textContent = busy ? 'Signing out…' : 'Sign out';
      logout.disabled = busy;
      logout.addEventListener('click', async () => {
        busy = true;
        renderDialog();
        try {
          await signOut();
          dialog.close();
        } catch (error) {
          message = errorMessage(error);
          busy = false;
          renderDialog();
        }
      });
      card.append(intro, account, buildAiSettingsSection(() => renderDialog()), logout);
      if (message) card.appendChild(statusMessage(message, true));
      return;
    }

    title.textContent = 'Welcome to Story Sprout';
    const intro = document.createElement('p');
    intro.textContent = 'Sign in to keep your creative space connected across visits.';

    const google = document.createElement('button');
    google.type = 'button';
    google.className = 'google-auth-button';
    google.disabled = busy || !isSupabaseConfigured;
    google.innerHTML = '<span aria-hidden="true">G</span> Continue with Google';
    google.addEventListener('click', async () => {
      busy = true;
      message = null;
      renderDialog();
      try {
        await signInWithGoogle();
      } catch (error) {
        message = errorMessage(error);
        busy = false;
        renderDialog();
      }
    });

    const divider = document.createElement('div');
    divider.className = 'auth-divider';
    divider.innerHTML = '<span>or use a magic link</span>';

    const form = document.createElement('form');
    form.className = 'magic-link-form';
    const label = document.createElement('label');
    label.htmlFor = 'auth-email';
    label.textContent = 'Email address';
    const row = document.createElement('div');
    const email = document.createElement('input');
    email.id = 'auth-email';
    email.name = 'email';
    email.type = 'email';
    email.autocomplete = 'email';
    email.placeholder = 'you@example.com';
    email.required = true;
    email.disabled = busy || !isSupabaseConfigured;
    const send = document.createElement('button');
    send.type = 'submit';
    send.textContent = busy ? 'Sending…' : 'Send link';
    send.disabled = busy || !isSupabaseConfigured;
    row.append(email, send);
    form.append(label, row);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      busy = true;
      message = null;
      const address = email.value;
      renderDialog();
      try {
        await sendMagicLink(address);
        busy = false;
        message = `Magic link sent to ${address}. Check your inbox.`;
        renderDialog();
      } catch (error) {
        busy = false;
        message = errorMessage(error);
        renderDialog();
      }
    });

    const privacy = document.createElement('small');
    privacy.className = 'auth-privacy';
    privacy.textContent = 'Secure sign-in powered by Supabase. No password needed.';
    card.append(intro, google, divider, form, privacy);
    if (message) card.appendChild(statusMessage(message, false));
    if (!isSupabaseConfigured) {
      card.appendChild(statusMessage('Add the Supabase environment variables to enable sign-in.', true));
    }
  };

  renderTrigger();
  void getAuthState()
    .then((state) => {
      currentUser = state.user;
      renderTrigger();
    })
    .catch((error) => {
      message = errorMessage(error);
    });
  onAuthChange((state) => {
    currentUser = state.user;
    busy = false;
    renderTrigger();
    if (dialog.open) renderDialog();
  });
}

/** AI settings inside the account dialog: OpenRouter key + story model. */
function buildAiSettingsSection(rerender: () => void): HTMLElement {
  const section = document.createElement('div');
  section.className = 'ai-settings';
  const heading = document.createElement('h3');
  heading.textContent = 'AI story generation';
  const note = document.createElement('p');
  note.className = 'ai-settings-note';
  note.textContent =
    'Your OpenRouter key is stored in your private Story Sprout settings and sent only to openrouter.ai. Get one at openrouter.ai/keys.';
  section.append(heading, note);

  const state = getAiSettings();
  const status = document.createElement('div');
  status.className = 'auth-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  const showStatus = (text: string, isError: boolean) => {
    status.textContent = text;
    status.classList.toggle('error', isError);
    status.hidden = false;
  };

  if (state.openRouterApiKey) {
    const row = document.createElement('div');
    row.className = 'ai-key-row';
    const saved = document.createElement('span');
    saved.className = 'ai-key-saved';
    saved.textContent = `Key saved (…${state.openRouterApiKey.slice(-4)})`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'auth-secondary-button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', async () => {
      remove.disabled = true;
      try {
        await saveAiSettings({ openRouterApiKey: '' });
        rerender();
      } catch (error) {
        remove.disabled = false;
        showStatus(error instanceof Error ? error.message : 'Could not remove the key.', true);
      }
    });
    row.append(saved, remove);
    section.appendChild(row);
  } else {
    const editor = document.createElement('div');
    editor.className = 'ai-key-editor';
    const label = document.createElement('label');
    label.htmlFor = 'openrouter-api-key';
    label.textContent = 'OpenRouter API key';
    const row = document.createElement('div');
    row.className = 'ai-key-row';
    const input = document.createElement('input');
    input.id = 'openrouter-api-key';
    input.type = 'password';
    input.placeholder = 'sk-or-…';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'OpenRouter API key');
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'auth-secondary-button';
    save.textContent = 'Save key';
    save.addEventListener('click', async () => {
      const key = input.value.trim();
      if (!key) return;
      save.disabled = true;
      save.textContent = 'Saving…';
      try {
        await saveAiSettings({ openRouterApiKey: key });
        rerender();
      } catch (error) {
        save.disabled = false;
        save.textContent = 'Save key';
        showStatus(error instanceof Error ? error.message : 'Could not save the key.', true);
      }
    });
    row.append(input, save);
    editor.append(label, row);
    section.appendChild(editor);
  }

  const modelRow = document.createElement('div');
  modelRow.className = 'ai-model-row';
  const modelLabel = document.createElement('label');
  modelLabel.htmlFor = 'ai-model-picker';
  modelLabel.textContent = 'Story model';
  const picker = document.createElement('select');
  picker.id = 'ai-model-picker';
  for (const model of STORY_MODELS) {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.label;
    if (model.id === (state.storyModel || DEFAULT_STORY_MODEL)) option.selected = true;
    picker.appendChild(option);
  }
  picker.addEventListener('change', () => {
    void saveAiSettings({ storyModel: picker.value }).catch((error) => {
      showStatus(error instanceof Error ? error.message : 'Could not save the model choice.', true);
    });
  });
  modelRow.append(modelLabel, picker);
  section.append(modelRow, status);
  return section;
}

function userName(user: User): string {
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof metadataName === 'string' && metadataName.trim()) return metadataName.trim();
  return user.email?.split('@')[0] ?? 'Story maker';
}

function userInitial(user: User): string {
  return userName(user).charAt(0).toUpperCase() || 'S';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function statusMessage(message: string, isError: boolean): HTMLDivElement {
  const status = document.createElement('div');
  status.className = `auth-status${isError ? ' error' : ''}`;
  status.setAttribute('role', 'status');
  status.textContent = message;
  return status;
}
