# Repository workflow

## Automatic publishing

After completing a prompt that changes this repository:

1. Run the relevant tests or build checks.
2. If the checks pass, commit all in-scope changes with a concise message.
3. Push the commit to the current GitHub branch automatically.

Do not wait for a separate push request. Skip automatic publishing when the
user explicitly says not to commit or push, when the task is read-only, when
checks fail, or when the changes could expose secrets or unrelated local work.
Never commit `.env` files, API keys, private recordings, or generated private
audio.
