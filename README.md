# TTS Assistant

TTS Assistant is a web application that leverages OpenAI's Text-to-Speech API to transform written text into spoken words. Designed with simplicity in mind, it's a great tool for educators, developers, and content creators who need to incorporate high-quality speech synthesis into their projects or learning materials.

OpenAI key required to use the application. You can sign up for an account [here](https://platform.openai.com/).

## Features

- **Text-to-Speech Conversion:** Turn any text into natural-sounding speech.
- **Locally Stored:** Save, manage, export, and replay your TTS files with ease.
- **Customizable Settings:** Choose from different voices, speeds, and formats to tailor the audio output to your needs.
- **User-Friendly Interface:** Intuitive design for a seamless user experience.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. You can also visit the [repo's site](https://davidbradbury.github.io/tts-assistant/) to run the application.

Note: All data is stored locally in your browser's cache and is only used to send requests to the OpenAI API. No other data is collected, sent elsewhere, or stored.

### Prerequisites

Before running the application, make sure you have Node.js installed on your system, which comes with npm. npm is used to install the http-server, a simple zero-configuration command-line HTTP server.

```bash
# Install Node.js and npm from https://nodejs.org/

# Verify the installation of Node.js
node -v

# Verify the installation of npm
npm -v
```

### Installation

Follow these steps to get your development environment running:

1. **Clone the repository**

   ```bash
   git clone https://github.com/DavidBradbury/tts-assistant.git
   cd tts-assistant
   ```

2. **Install http-server globally**

   ```bash
   npm install --global http-server
   ```

3. **Start the application**

   From the project directory, run:

   ```bash
   http-server -o
   ```

   This will start the server and open the application in your default web browser.

   Alternatively, you can use any static file server. If you prefer Python and have it installed, you can use its built-in server:

   ```bash
   # For Python 3.x
   python -m http.server
   ```

   Access the app through `localhost` in your browser with the port provided by the http-server output.

## Built With

- [OpenAI TTS API](https://beta.openai.com/docs/api-reference/text-generation) - Text-to-Speech service used
- Vanilla HTML, CSS, and JavaScript - For the front-end

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

- **David Bradbury** - _Initial work_ - [DavidBradbury](https://d-b.dev)

See also the list of [contributors](https://github.com/DavidBradbury/tts-assistant/contributors) who participated in this project.

## Acknowledgments

- [OpenAI](https://openai.com/) for the [TTS API](https://platform.openai.com/docs/api-reference/audio)
- [RealFaviconGenerator](https://realfavicongenerator.net/) for the favicon.
- [htmlToElement](https://stackoverflow.com/a/35385518/689129) for the insight on modern HTML to DOM element conversion using HTMLTemplateElement.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
