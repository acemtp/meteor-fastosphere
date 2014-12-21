# meteor-fastosphere

It's the source code of the website http://fastosphere.meteor.com, a blazing fast Meteor packages search powered by Algolia.

If you want to use it, please change analytics ID with yours in `<head>` part of `client.html`. Also `cp settings.example.json settings.js`, create an account on Algolia and fill your `settings.json` with the Algolia generated keys.

## Command line

Why creating a command line for searching package since there's already `meteor search`? If you really want to know, just do this test: 

- meteor search bootstrap
- npm -g install fastosphere
- fastosphere bootstrap

Which one do you prefer?

You can also test:

- fastosphere boot      # lazy
- fastosphere b         # really lazy
- fastosphere bootsrap  # dyslexic

### Installation

    npm -g install fastosphere

### Usage

`fastosphere -h` will give you all the information.

    Usage: fastosphere [options] <search ...>

    Options:

    -h, --help        output usage information
    -V, --version     output the version number
    -g, --github      display GitHub url
    -n, --nbhits <n>  number of results (default: 10)
    -l, --long        list in long format

    Examples:

    $ fastosphere acemtp -g   # Display GitHub link (⌘ + click on it to open the url)
    $ fastosphere acemtp -l   # Display in long format (version & release date)
    $ fastosphere boot -n 20  # Display 20 results

