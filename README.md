# Fastosphere

**Fastosphere** is a [website](http://fastosphere.meteorapp.com) and a [CLI](http://en.wikipedia.org/wiki/Command-line_interface) to search Meteor packages really quickly thanks to [Algolia](http://algolia.com) search engine.

## Website

http://fastosphere.meteorapp.com provides you a very quick and easy way to find Meteor packages. You'll have basic information like package name, description, latest version, latest release date, GitHub Url, number of GitHub stars.

It's an alternative to [Atmosphere](https://atmospherejs.com). **The main advantages are it's freesoftware and a lot faster than Atmosphere.**

## Command Line Interface (CLI)

The command line has a few really cool features.

### Install

    sudo npm -g install fastosphere

or if you have an older version

    sudo npm update -g

### Search

It's an alternative to `meteor search`. **The main advantage is it gives you real information about packages to help you to choose which one you want to install** (GitHub stars, sort by score, GitHub Urls). So you don't have to leave your terminal to find which package to install.

If you want to compare, do this test:

    $ meteor search moment
    $ npm -g install fastosphere
    $ fastosphere moment

![3__acemtp_macbook-pro-de-vianney____m_meteor-fastosphere-changelog-test__zsh_](https://cloud.githubusercontent.com/assets/103561/5565008/f89a4d1c-8ede-11e4-8baf-1ff3d667e907.png)

You can also test:

    $ fastosphere mo           # lazy
    $ fastosphere m            # really lazy
    $ fastosphere moomment     # dyslexic
    $ fastosphere moment -n 2  # display only 2 results
    $ fastosphere moment -g    # GitHub Urls (⌘ + click on the url to open the url)
    $ fastosphere moment -l    # display more information (last month and last week download, GitHub and Atmosphere stars)

## Fork this project

If you want to fork this project, please change analytics ID with yours in `<head>` part of `client.html`. Also `cp settings.example.json settings.js`, create an account on Algolia and fill your `settings.json` with the Algolia generated keys. Do the same for github api keys.
