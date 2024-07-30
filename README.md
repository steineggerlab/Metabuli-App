# Metabuli Desktop Application 

This project is a desktop application for Metabuli built with Vue.js and Electron, which enables development of cross-platform desktop apps using web technologies.

For more details of Metabuli, please see
[GitHub](https://github.com/steineggerlab/Metabuli),
[Nature Methods](https://www.nature.com/articles/s41592-024-02273-y), 
[PDF](https://www.nature.com/articles/s41592-024-02273-y.epdf?sharing_token=je_2D5Su0-xVOSjuKSAXF9RgN0jAjWel9jnR3ZoTv0M7gE7NDF_xi_3sW8QdRiwfSJNwqaXItSoeCvr7cvcoQxKLt0oROgWc6urmki9tP80cXEuHPN0D7b4y9y3i8Yv7sZw8MxxhAj7W6p9eZE2zaK3eozdOkXvwADVfso9cXIM%3D), 
[bioRxiv](https://www.biorxiv.org/content/10.1101/2023.05.31.543018v2), or [ISMB 2023 talk](https://www.youtube.com/watch?v=vz2fuRcVwyk).
<p align="center"><img src="https://raw.githubusercontent.com/steineggerlab/Metabuli/master/.github/marv_metabuli_small.png" height="350" /></p>

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: Install Node.js (version 12.x or later).
- **npm**: Install npm (version 6.x or later).
- **Vue CLI**: Install Vue CLI if you haven't already (`npm install -g @vue/cli`).

## Getting Started

To get a local copy up and running, follow these steps:

### Installation

1. **Clone the repository**:

    ```sh
    git clone https://github.com/snjlee58/Metabuli-App.git
    ```

2. **Navigate to the project directory**:

    ```sh
    cd metabuli-app
    ```

3. **Install dependencies**:

    ```sh
    npm install
    ```

### Running the Desktop Application

To run the application in development mode with hot reloading:

```sh
npm run electron:serve
```

### Building the Desktop Application

To build the application, run the following command:

    ```sh
    npm run electron:build
    ```

The executable application (currently only for macOS) can be found in the `dist_electron/mac-arm64` folder.