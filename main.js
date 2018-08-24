
PDFJS.disableWorker = true;

/* 
  GLOBALS - PAGE ELEMENTS 
*/
var pdf = document.getElementById('pdf');
var excel = document.getElementById('excel');
var percent_obj = document.getElementById('wait_time');


/* 
  GLOBALS - DATA 
*/
var O_PDF = new jsPDF("p", "mm", "a4" );
var NAME_LIST = [];
var TEST_PAGES;
var SAVE_NAME;
var LOADING_PERCENT = 0;
var PERCENT_INCREMENT = 0;
var STAGED = false;

/* 
  EVENT LISTENERS 
*/
excel.addEventListener('change', handleExFile, false);
pdf.addEventListener('change', handlePDFFile, false);
document.getElementById('redact_button').addEventListener("click", generatePDF, false);

/* 
  PDF RREADING/WRITING
*/

/* Checks that loaded file is PDF. */
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

/* Handles button click. */
function generatePDF() {
  document.getElementById('redact_button').blur();
  if(document.getElementById('process_status').innerHTML 
    == "Processing... For better performance, stay on this tab.") {
    return;
  }
  LOADING_PERCENT = 0;

  /* If PDF already generated, download file. */
  if(STAGED) {
    console.log("downloading");
    O_PDF.save(SAVE_NAME);
    return;
  }

  /* Check and initialize inputs. */
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
    /* Expands name list such that each name maps to one pdf page.
       Every page of a given assessment should be marked with the name
       of the student for whom the assessment was made, so each name
       must appear in the list a number of times equal to the number
       of pages of each assessment.
    */
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

  /* Update HTML */
  document.getElementById("process_status").style.color = "black";
  document.getElementById('process_status').innerHTML = "Processing... For better performance, stay on this tab.";
  updatePercent(0);
  
  /* Generate PDF. */
  fileReader = new FileReader();
  fileReader.onload = function(ev) {
    SAVE_NAME = "GEN_" + pdf.files[0].name;

      console.log(ev);

      /* On file load: */
      PDFJS.getDocument(fileReader.result).then(function getPdfHelloWorld(pdf) {
                
        PERCENT_INCREMENT = 100 / pdf.numPages;
        var page_promise = 1;
        var prom_list = [];
        var prom_chain;

        /* Make list of promises, one for each page to be cropped. */
        for(var i = 1; i <= pdf.numPages; i++) {
          console.log("start");

          page_promise = loadPage(pdf,i,page_promise);
          prom_list.push(new Promise((resolve, reject) => {resolve(page_promise)})); 
        }

        /* Update HTML when all promises resolve (doc is completely cropped). */
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

/* Load page, return promise to crop page. 
   Ensures that page processing is sequential. */
async function loadPage(pdf, i, prom) {
  await prom;
  if(i > 1) {
    O_PDF.addPage();
  }
  return pdf.getPage(i).then(function(page) {
      return (new Promise((resolve, reject) => {resolve(convertPage(page, i))}));
    });   
}

/* Adds student name to a single page. */
function convertPage(page, i) {
  /* Scale determines resolution - higher number, better res. */
  var scale = 5;
  var viewport = page.getViewport(scale);
  
  /* Create new canvas. */
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  
  /* Render PDF as canvas. */
  var task = page.render({canvasContext: context, viewport: viewport});

  return task.promise.then(function(){
    
    var imgData = canvas.toDataURL("image/jpeg", 1.0);

    /* Crop canvas and render as image. */
    var imgCrop = new Image();
    imgCrop.src = imgData;
    O_PDF.setPage(i);

    console.log(canvas.width);
    O_PDF.addImage(imgCrop, 'JPEG', 0,0, 210, 297);
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