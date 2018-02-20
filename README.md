# Site Match

Have you ever wanted to run across all of your project's URLs and spot visual differences?

Then site-match is for you. Heavily inspired by [this article](https://meowni.ca/posts/2017-puppeteer-tests/) from [Monica Dinculescu](https://github.com/notwaldorf), site-match leverages [Puppeteer](https://github.com/GoogleChrome/puppeteer) to create a bunch of screenshots of your website and then compare them.

# CLI binaries

## `site-match`

```text
site-match <file> [domain] [options]

Generates screenshots according to yaml

Positionals:
  file    The file to get the config from
  domain  optional domain to overwrite the config with

Options:
  --version          Show version number                               [boolean]
  --concurrent, -c   Concurrent tabs generating screenshots
                                                          [number] [default: 10]
  --ws-endpoint, -e  WebSocket for Puppeteer to connect to
  -h, --help         Show help                                         [boolean]
  ```

Here's an example YAML file:

```yaml
domain: https://leanin.org
devices:
  mobile:
     width: 414
     pixelRatio: 2
  desktop:
     width: 1200
css: >
  *, *:before, *:after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
urls:
   - url: '/'
   - url: '/'
     name: 'bounce'
     css: >
      .bounce-modal {
        display: block;
      }
   - url: '/mentor-her/'
     css: >
      .section-tall-wrapper {
        min-height: auto !important;
      }
   - url: '/about/'
   - url: '/education'
 ```

Which will generate these files:

```text
├── about-desktop.png
├── about-mobile.png
├── bounce-desktop.png
├── bounce-mobile.png
├── education-desktop.png
├── education-mobile.png
├── home-desktop.png
├── home-mobile.png
├── index.html
├── mentor-her-desktop.png
└── mentor-her-mobile.png
```

## `site-match-diff`

```text
site-match-diff <dir1> <dir2> [options]

Compares screenshots from first directory with second directory

Positionals:
  dir1  Directory to compare with
  dir2  Directory to compare against

Options:
  --version         Show version number                                [boolean]
  --concurrent, -c  Concurrent comparisons                [number] [default: 10]
  -h, --help        Show help                                          [boolean]
```

Which will compare each file from `dir1` with `dir2`, complaining about any missing files and showing % of deviation per file. An HTML and a JSON files are generated to better preview the files and see the differences.
