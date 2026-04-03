# Contributing to Koda Store

First off, thank you for considering contributing to Koda Store! It's people like you that make the open-source community such a fantastic place to learn, inspire, and create.

## Getting Started

1. **Fork the repository** to your own GitHub account.
2. **Clone the project** to your local machine.
3. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies** and set up the project (see `README.md`).

## Development Process

1. **Write your code**: Make your changes locally.
2. **Test your code**: Ensure the app builds and runs successfully (`npm run build`).
3. **Commit your changes**: Use descriptive commit messages.
   ```bash
   git commit -m "feat: add user profile picture support"
   ```
4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Submit a Pull Request**: Go to the original repository and open a Pull Request. Provide a clear description of the problem you're solving or the feature you're adding.

## Code Style
* The project uses TypeScript. Please ensure your code is strongly typed and avoids `any` where possible.
* Use ESLint and standard formatting (`npm run lint`).
* CSS styles are generally handled via Tailwind or vanilla CSS. Try to keep consistent with the existing `globals.css` structure.

## Reporting Bugs
If you find a bug, please create an Issue on GitHub with:
1. A clear title.
2. Steps to reproduce the bug.
3. Expected vs actual behavior.
4. Information about your environment (OS, Node version, browser).

Thank you for contributing!
