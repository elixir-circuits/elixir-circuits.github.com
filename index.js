"use strict";

var hexSearch = {
  state: {
    availableLibrariesDom: document.querySelector(".js-hex-search-circuits-libs"),
    aleLibrariesDom: document.querySelector(".js-hex-search-ale-libs"),
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
          console.log(e);
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
    .get("https://hex.pm/api/packages?search=depends%3A" + libraryName + "&sort=downloads")
  },

  libsFromResponse: function (responseData) {
    var libs = [];

    for (var i = 0; i < responseData.length; i++) {
      libs.push({
        name: responseData[i].name,
        url: responseData[i].html_url,
        description: responseData[i].meta.description,
        downloads: responseData[i].downloads.all
      });
    }

    return libs;
  },

  updateDom: function(state) {
    var container_circuits_i2c = this.updateDomSection(state.i2cLibraries, "circuits_i2c");
    var container_circuits_gpio = this.updateDomSection(state.gpioLibraries, "circuits_gpio");
    var container_circuits_spi = this.updateDomSection(state.spiLibraries, "circuits_spi");
    var container_circuits_uart = this.updateDomSection(state.uartLibraries, "circuits_uart");
    var container_nerves_uart = this.updateDomSection(state.nervesUartLibraries, "nerves_uart");

    var container_elixir_ale = this.updateDomSection(state.aleLibraries, "elixir_ale");

    state.availableLibrariesDom.innerHTML = container_circuits_i2c +
	  container_circuits_gpio +
	  container_circuits_spi +
          container_circuits_uart +
	  container_nerves_uart;

    state.aleLibrariesDom.innerHTML = container_elixir_ale;
  },

  updateDomSection: function(libs, protocol) {
    var tbody = document.createElement("tbody");

    for (var i = 0; i < libs.length; i++) {
      var tr = this.buildLibTRItem(libs[i], protocol);
      tbody.appendChild(tr);
    }

      const container_content =  `
        <div class="container">
           <h3 class="header h3 text center">${protocol}</h3>

           <table class="search-table">
              <thead>
                <tr>
                   <th>Name</th>
                   <!-- <th>Protocol</th> -->
                   <th>Downloads</th>
                   <th>Description</th>
                </tr>
              <thead>
              ${tbody.outerHTML}
           </table>
        </div>
      `;

     return container_content;
  },

  buildLibTRItem: function (lib, protocol) {
    var pName = this.tdaNode(lib.name, lib.url);
    var protocol = this.tdNode(protocol);
    var downloads = this.tdNode(lib.downloads);
    var description = this.tdNode(lib.description);
    var tr = document.createElement("tr");
    tr.appendChild(pName);
    //tr.appendChild(protocol);
    tr.appendChild(downloads);
    tr.appendChild(description);

    return tr;
  },

  pNode: function (txt) {
    var txtNode = document.createTextNode(txt);
    var p = document.createElement("p");
    p.appendChild(txtNode);

    return p;
  },

    tdNode:function (txt) {
	var txtNode = document.createTextNode(txt);
	var td = document.createElement("td");
	td.appendChild(txtNode);
	return td;
    },

    tdaNode:function (txt, link) {
	var txtNode = document.createTextNode(txt);
	var td = document.createElement("td");

        var a = document.createElement("a");
        a.appendChild(txtNode);
        a.href = link;
        a.target = "blank";

	td.appendChild(a);
	return td;
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

