import type { User } from '@supabase/supabase-js';
import {
  authErrorFromUrl,
  getAuthState,
  isSupabaseConfigured,
  onAuthChange,
  sendMagicLink,
  signInWithGoogle,
  signOut,
} from '../auth/supabase';

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
      card.append(intro, account, logout);
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
