## Molecule Vizualisation

A library for creating 2D molecule like visualisations.

<video width="100%" muted loop autoplay preload="auto">
  <source src="./readme-video.mp4" type="video/mp4">
</video>


## Developing

- ``` npm run dev ``` to start up webpack and a watcher that will autorebuild while you develop.

- run ``` http-server  ``` in the root folder to open a development server to the folder. [more info](https://www.npmjs.com/package/http-server)

- open the webpage using the url given by http-server
	- /index.html: Viewing the molecule vizualisation
	- /editor.html: To edit/create molecule vizualisation layers
	- /import-test.html: Testing importing layers on different sizes.

## Building the library

``` npm run build ``` to create the build version in the ```./dist``` folder.

## Philosophy

- Using molecule-emitters that are placed on the canvas that spawn molecules.
- Placing/Editing/Finetuning these emitters is the way to create a final vizualisation.
- This visualisation can be exported to a json and saved as a 'layer' that can be later loaded back into the library.

## Usage

This library is a MVL (minimum viable library) we built as the base for our [cancer visualisation](https://github.com/qvvdata/2019-krebs/tree/master/interaktiv/cancerVizualisation) for this [article](https://www.addendum.org/krebs/menschen-wie-sie/).

At the moment if you want to use this library effectively, you use it as an editor to build your layers. After that you create your own app that uses the MoleculeVizualisation to load in your layers and use it in whatever you like. 

The MoleculeVizualisation supports state changes and animates them, but switching between layers in anyway has to be coded by you and is best done in your own custom class.

you should inspect the [cancer visualisation](https://github.com/qvvdata/2019-krebs/tree/master/interaktiv/cancerVizualisation) very carefully to understand how we created and used the layers.

## Future plans

- Port the layer/state change and animation functionality written in the [cancer visualisation](https://github.com/qvvdata/2019-krebs/tree/master/interaktiv/cancerVizualisation) to this library.

- Create a detailed api. Will be done once we have a stable v1.0.0 api. For now you have to inspect the code.

## Future future plans

Creating a webbassed fully-fledged editor where you can visually create and animate your layer changes and export it to a pre-built class.

## License


[Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)

See Licese.md for more info.