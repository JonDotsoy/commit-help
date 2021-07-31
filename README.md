# Commit-Help

[![Node.js Package](https://github.com/JonDotsoy/commit-help/actions/workflows/npm_publish.yml/badge.svg)](https://github.com/JonDotsoy/commit-help/actions/workflows/npm_publish.yml)

Features:

- Shell alias `feat`: helper to commit a feature `feat(scope): <message>` or `feat: <message>`
- Shell alias `fix`: helper to commit a fix `fix(scope): <message>` or `fix: <message>`
- Shell alias `refactor`: helper to commit a refactor `refactor(scope): <message>` or `refactor: <message>`
- Auto detect scope from change files using the `.mmrc.json` file

**Example mmrc file:**

```json
{
  "scopes": [
    {
      "name": "user",
      "match": "$CWD/apps/user/**"
    },
    {
      "name": "products",
      "match": "$CWD/apps/products/**"
    },
    {
      "name": "settings",
      "match": "$CWD/configs/**"
    }
  ]
}
```

## How to use

## How to install

```sh
npm install -g @jondotsoy/commit-help
```

and run add the next line to your shell config (.alias, .bashrc, .zshrc, etc):

```sh
eval $(commit-help -)
```

> You can use wthout install. Just add into your shell config:
>
> ```sh
> eval $(npx @jondotsoy/commit-help -)
> ```
>
> ⚠️ This can delay to the shell startup.
