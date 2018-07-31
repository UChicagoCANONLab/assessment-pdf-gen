
    PDFJS.disableWorker = true;

    /* GLOBALS - PAGE ELEMENTS */
    var pdf = document.getElementById('pdf');
    var excel = document.getElementById('excel');
    var percent_obj = document.getElementById('wait_time');


    /* GLOBALS - DATA */
    var O_PDF = new jsPDF("p", "mm", "a4" );
    var NAME_LIST = [];
    var TEST_PAGES;
    var SAVE_NAME;
    var LOADING_PERCENT = 0;
    var PERCENT_INCREMENT = 0;
    var STAGED = false;

    /* EVENT LISTENERS */
    excel.addEventListener('change', handleExFile, false);
    pdf.addEventListener('change', handlePDFFile, false);
    document.getElementById('redact_button').addEventListener("click", generatePDF, false);

    /* PDF LOADING HANDLER */
    function handlePDFFile(ev) {
      document.getElementById('pdf').blur();
      if(['application/pdf'].indexOf(pdf.files[0].type) == -1) {
        pdfError();
        return;
      }
      else {
        noError();
      }
    };

    /* BUTTON CLICK HANDLER */
    function generatePDF() {
      document.getElementById('redact_button').blur();
      if(document.getElementById('process_status').innerHTML == "Processing... For better performance, stay on this tab.") {
        return;
      }
      LOADING_PERCENT = 0;

      if(STAGED) {
        console.log("downloading");
        O_PDF.save(SAVE_NAME);
        O_PDF = new jsPDF();
        return;
      }

      TEST_PAGES = document.getElementById('pages_input').value;
      if(!pdf.files[0]) {
        fileError();
        return;
      }
      if(!NAME_LIST) {
        excelError();
        return;
      }
      else {
        var tmp = [];
        NAME_LIST.forEach(function(e) {
          for(var i=0; i < TEST_PAGES; i++) {
            tmp.push(e);
          }
        });
        NAME_LIST = tmp;
        console.log(NAME_LIST);
      }
      if(!excel.files[0]) {
        fileError();
        return;
      }
      if(['application/pdf'].indexOf(pdf.files[0].type) == -1) {
        pdfError();
        return;
      }
      if(!excelTypeCheck(excel.files[0])) {
        return;
      }
      if(Number(TEST_PAGES)) {
        TEST_PAGES = Number(TEST_PAGES);
      }
      else {
        numberError();
        return;
      }

      file = pdf.files[0]

      document.getElementById("process_status").style.color = "black";
      document.getElementById('process_status').innerHTML = "Processing... For better performance, stay on this tab.";
      updatePercent(0);
      

      fileReader = new FileReader();

      fileReader.onload = function(ev) {
        SAVE_NAME = "GEN_" + pdf.files[0].name;

          console.log(ev);
          PDFJS.getDocument(fileReader.result).then(function getPdfHelloWorld(pdf) {
            //
            // Fetch the first page
            //
            console.log(pdf);
            // these are  happening concurrently
              
            //console.log(i);
              //convertPage(pdf.getPage(i));
            PERCENT_INCREMENT = 100 / pdf.numPages;
            var page_promise = 1;
            var prom_list = [];
            var prom_chain;

            //prom_list.push(new Promise((resolve, reject) => {resolve(loadPage(pdf, 1))})); 

            for(var i = 1; i <= pdf.numPages; i++) {
              console.log("start");

              page_promise = loadPage(pdf,i,page_promise);
              prom_list.push(new Promise((resolve, reject) => {resolve(page_promise)})); 
              
            }
            Promise.all(prom_list).then(function() {
              document.getElementById('redact_button').value = "Download";
              STAGED = true;

              document.getElementById("process_status").style.color = "black";
              document.getElementById('process_status').innerHTML = "Done."
              percent_obj.innerHTML = "";

            })

          });
        };
        fileReader.readAsArrayBuffer(file);

      };

    /* ENSURES PAGE PROCESSING IS SEQUENTIAL */
    async function loadPage(pdf, i, prom) {
      await prom;
      if(i > 1) {
        O_PDF.addPage();
      }
      return pdf.getPage(i).then(function(page) {
          return (new Promise((resolve, reject) => {resolve(convertPage(page, i))}));
        });   
    }

    /* ADD NAME TO PAGE */
    function convertPage(page, i) {
      var scale = 5;
      //var viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
      var viewport = page.getViewport(scale);
      //
      // Prepare canvas using PDF page dimensions
      //

      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      
      //var c = new Croppie(document.getElementById('item'), opts);

      //
      // Render PDF page into canvas context
      // try to do for specific page???
      var task = page.render({canvasContext: context, viewport: viewport})
      return task.promise.then(function(){
        
        var imgData = canvas.toDataURL("image/jpeg", 1.0);

        var imgCrop = new Image();
        imgCrop.src = imgData;
        O_PDF.setPage(i);

        console.log(canvas.width);
        O_PDF.addImage(imgCrop, 'JPEG', 0,0, 210, 297);//, O_PDF.internal.pageSize.width, O_PDF.internal.pageSize.height);
        if(NAME_LIST[0]) {
          O_PDF.text(10, 10, NAME_LIST[0]);
        }
        NAME_LIST.shift();
      
        console.log("page saved");
        console.log(PERCENT_INCREMENT);
        updatePercent(PERCENT_INCREMENT);

      });
    }

    /* ERROR REPORTS */
    function pdfError() {
      document.getElementById("process_status").style.color = "red";
      document.getElementById('process_status').innerHTML = "Error: not a PDF.";
    }

    function fileError() {
      document.getElementById("process_status").style.color = "red";
      document.getElementById('process_status').innerHTML = "Error: missing file.";
    }

    function numberError() {
      document.getElementById("process_status").style.color = "red";
      document.getElementById('process_status').innerHTML = "Error: please enter a valid number of pages.";
    }

    function noError() {
       document.getElementById('process_status').innerHTML = "";
    }

    function updatePercent(inc) {
      if(LOADING_PERCENT < 100) {
        LOADING_PERCENT += inc;
      }
      percent_obj.innerHTML = Math.round(LOADING_PERCENT) + "%";
      console.log(percent_obj.innerHTML);
    }