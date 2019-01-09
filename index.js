"use strict";

var hexSearch = {
  state: {
    avaliableLibrariesDom: document.querySelector(".js-hex-search-avalibale-libraries"),
    i2cLibraries: [],
    spiLibraries: [],
    gpioLibraries: [],
    uartLibraries: [],
    selectedLibraries: [],
    lastSearch: null,
  },

  init: function () {
    console.log("Starting query eng");

    var jsQueryDom = document.querySelector(".js-hex-query-component");
    var jsHexSearchlibraries = document.querySelectorAll(".js-hex-circuits-library");

    for (var i = 0; i < jsHexSearchlibraries.length; i++) {
      this.attachLibraryClick(jsHexSearchlibraries[i], this.state);
    }
  },

  update: function(update_command, updateData, state) {
    switch (update_command) {
      case "search":
        var elm = updateData[0];
        var libQuery = updateData[1];

        if (elm.classList.contains("active")) {
          state[this.libNameToStateName(libQuery)] = [];
          elm.classList.remove("active");
          this.update("updateDom", null, state);
        } else {
          state.lastSearch = libQuery;
          elm.classList.add("active");
          this.update("search_response", this.search(libQuery), state);
        }

        break;
      case "search_response":
        updateData
         .then(function (response) {
           for (var i = 0; i < response.data.length; i++) {
             var lib = {
               name: response.data[i].name,
               url: response.data[i].html_url,
               description: response.data[i].meta.description,
             };

             if (state.lastSearch === "circuits_i2c") {
               state.i2cLibraries.push(lib);
             }

             if (state.lastSearch === "circuits_gpio") {
               state.gpioLibraries.push(lib);
             }

             if (state.lastSearch === "circuits_spi") {
               state.gpioLibraries.push(lib);
             }

             if (state.lastSearch === "circuits_uart") {
               state.uartLibraries.push(lib);
             }
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

  attachLibraryClick: function (libraryDomElm, state) {
    libraryDomElm.addEventListener("click", function (event) {
      event.preventDefault();
      this.update("search", [event.target, event.target.getAttribute("data-name")], state);
    }.bind(this))
  },

  search: function (libraryName) {
    return axios
    .get("https://hex.pm/api/packages?search=depends%3A" + libraryName)
  },

  updateDom: function(state) {
    var ul = document.createElement("ul");
    ul.id = "js-hex-lib-list";

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

    var oldList = document.getElementById("js-hex-lib-list");

    if (oldList) {
      state.avaliableLibrariesDom.removeChild(oldList);
    }
   
    state.avaliableLibrariesDom.appendChild(ul);
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
    }
  },
        
}

window.addEventListener("load", function (event) {
  hexSearch.init();
});

