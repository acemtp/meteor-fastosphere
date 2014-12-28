# meteor-fastosphere

**Fastosphere** is a [website](http://fastosphere.meteor.com) and a [CLI](http://en.wikipedia.org/wiki/Command-line_interface) to search Meteor packages really quickly thanks to [Algolia search engine](http://algolia.com).

## Website

http://fastosphere.meteor.com provides you a very quick and easy way to find Meteor package. You'll have basic information like package name, description, latest version, latest release date, GitHub Url, number of GitHub stars.

It's an alternative to [Atmosphere](https://atmospherejs.com). The main advantages are it's freesoftware and a lot faster than Atmosphere.

## Command Line Interface (CLI)

### Install

    npm -g install fastosphere

### Search

It's an alternative to `meteor search`. The main advantage is it gives you real information about packages to help you to choose which one you want to install (GitHub stars, sort by score, GitHub Urls). 

If you want to compare, do this test:

    $ meteor search moment
    $ npm -g install fastosphere
    $ fastosphere search moment -l

You can also test:

    $ fastosphere search mo           # lazy
    $ fastosphere search m            # really lazy
    $ fastosphere search moomment     # dyslexic
    $ fastosphere search moment -n 2  # 2 results
    $ fastosphere search moment -g    # GitHub Urls (⌘ + click on the url to open the url)
    $ fastosphere search moment -l    # long format (more info)

### Changelog

With `fastosphere`, you can see what is new in the packages you use in a Meteor project. Go inside a Meteor project and type:

    $ fastosphere

It'll display all changelogs between your current version and the most up to date.

If you want to do a test from scratch:

    $ git clone https://github.com/acemtp/meteor-fastosphere-changelog-test.git
    $ meteor-fastosphere-changelog-test
    $ fastosphere



### Add

Do you feel lucky? You can use `fastosphere` to install a Meteor package without the need to know the name of the maintainer or which one if the best one.

You want to install `momentjs:moment`?

    $ fastosphere add mo

It'll install the first result of the search `fastosphere search mo`.





## Fork this project

If you want to fork this project, please change analytics ID with yours in `<head>` part of `client.html`. Also `cp settings.example.json settings.js`, create an account on Algolia and fill your `settings.json` with the Algolia generated keys. Do the same for github api keys.
