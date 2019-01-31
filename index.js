"use strict";

var hexSearch = {
  state: {
    availableLibrariesDom: document.querySelector(".js-hex-search-available-libraries"),
    aleLibrariesDom: document.querySelector(".js-elixir-ale-libraries"),
    searchedLibs: ["circuits_uart", "circuits_i2c", "circuits_gpio", "circuits_spi", "nerves_uart", "elixir_ale"],
    i2cLibraries: [],
    spiLibraries: [],
    gpioLibraries: [],
    uartLibraries: [],
    nervesUartLibraries: [],
    aleLibraries: [],
    selectedLibraries: [],
    lastSearch: null,
  },

  init: function () {
    this.update("search", null, this.state);
  },

  update: function(update_command, updateData, state) {
    switch (update_command) {
      case "search":
        this.update("search_response", this.search(state), state);
        break;
      case "search_response":
        updateData
         .then(function (responses) {
           // assumes that the keys to the reponse
           // object is the same as the keys in
           // our state model for the libraries
           var libs = Object.keys(responses);

           for (var i = 0; i < libs.length; i++) {
             state[libs[i]] = responses[libs[i]];
           }

           this.update("updateDom", null, state);
         }.bind(this)
         )
        .catch(function (e) {
          consoe.log(e);
        });
        break;

      case "updateDom":
        this.updateDom(state);
        break;
      default:
        console.warn("Invalid update command: " + update_command);
    }
  },

  search: function (state) {
    var libReqs = [];

    for (var i = 0; i < state.searchedLibs.length; i++) {
      libReqs.push(this.searchLib(state.searchedLibs[i]));
    }

    return axios.all(libReqs)
      .then(axios.spread(function (cuart, i2c, gpio, spi, nuart, ale) {
        var responses = {
          uartLibraries: this.libsFromResponse(cuart.data),
          i2cLibraries: this.libsFromResponse(i2c.data),
          gpioLibraries: this.libsFromResponse(gpio.data),
          spiLibraries: this.libsFromResponse(spi.data),
          nervesUartLibraries: this.libsFromResponse(nuart.data),
          aleLibraries: this.libsFromResponse(ale.data),
        };

        return responses;
      }.bind(this)).bind(this));
  },

  searchLib: function (libraryName) {
    return axios
    .get("https://hex.pm/api/packages?search=depends%3A" + libraryName)
  },

  libsFromResponse: function (responseData) {
    var libs = [];

    for (var i = 0; i < responseData.length; i++) {
      libs.push({
        name: responseData[i].name,
        url: responseData[i].html_url,
        description: responseData[i].meta.description,
      });
    }

    return libs;
  },

  updateDom: function(state) {
    var ul = document.createElement("ul");
    ul.classList.add("flex-container");
    ul.id = "js-hex-lib-list";

    var aleUl = document.createElement("ul");
    aleUl.classList.add("flex-container");
    aleUl.id = "js-hex-ale-list";

    for (var i = 0; i < state.i2cLibraries.length; i++) {
      var li = this.buildLibListItem(state.i2cLibraries[i], "circuits_i2c");
      ul.appendChild(li);
    }

    for (var i = 0; i < state.gpioLibraries.length; i++) {
      var li = this.buildLibListItem(state.gpioLibraries[i], "circuits_gpio");
      ul.appendChild(li);
    }

    for (var i = 0; i < state.spiLibraries.length; i++) {
      var li = this.buildLibListItem(state.spiLibraries[i], "circuits_spi");
      ul.appendChild(li);
    }

    for (var i = 0; i < state.uartLibraries.length; i++) {
      var li = this.buildLibListItem(state.uartLibraries[i], "circuits_uart");
      ul.appendChild(li);
    }

    for (var i = 0; i < state.nervesUartLibraries.length; i++) {
      var li = this.buildLibListItem(state.nervesUartLibraries[i], "nerves_uart");
      ul.appendChild(li);
    }

    for (var i = 0; i < state.aleLibraries.length; i++) {
      var li = this.buildLibListItem(state.aleLibraries[i], "elixir_ale");
      aleUl.appendChild(li);
    }

    state.availableLibrariesDom.appendChild(ul);
    state.aleLibrariesDom.appendChild(aleUl);
  },

  buildLibListItem: function (lib, protocol) {
    var pName = this.aNode(lib.name, lib.url);
    var protocol = this.pNode(protocol);
    var description = this.pNode(lib.description);
    var li = document.createElement("li");
    li.className += " library-search-item";
    pName.className += " library-name";
    protocol.className += " protocol-name";
    description.className += "library-description";
    li.appendChild(pName);
    li.appendChild(protocol);
    li.appendChild(description);

    return li;
  },

  pNode: function (txt) {
    var txtNode = document.createTextNode(txt);
    var p = document.createElement("p");
    p.appendChild(txtNode);

    return p;
  },

  aNode: function (txt, link) {
    var txtNode = document.createTextNode(txt);
    var a = document.createElement("a");
    a.appendChild(txtNode);
    a.href = link;
    a.target = "blank";

    return a;
  },

  libNameToStateName: function (libName) {
    switch (libName) {
      case "circuits_i2c":
        return "i2cLibraries";
        break;
      case "circuits_gpio":
        return "gpioLibraries";
        break;
      case "circuits_spi":
        return "spiLibraries";
        break;
      case "circuits_uart":
        return "uartLibraries";
        break;
      case "nerves_uart":
        return "nervesUartLibraries";
        break;
    }
  },

}

window.addEventListener("load", function (event) {
  hexSearch.init();
});

