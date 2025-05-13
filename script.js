document.addEventListener('DOMContentLoaded', function() {
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const base64Output = document.getElementById('base64Output');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const dropArea = document.getElementById('dropArea');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const darkModeIcon = document.getElementById('darkModeIcon');
  const outputInfo = document.getElementById('outputInfo');

  // Drag & Drop functionality
  ['dragenter','dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.add('dragover');
    });
  });
  ['dragleave','drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove('dragover');
    });
  });
  dropArea.addEventListener('drop', function(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      imageInput.files = files;
      imageInput.dispatchEvent(new Event('change'));
    }
  });

  // Dark mode toggle
  function setDarkMode(enabled) {
    document.body.classList.toggle('dark-mode', enabled);
    darkModeIcon.textContent = enabled ? '☀️' : '🌙';
    localStorage.setItem('imgb64_dark', enabled ? '1' : '0');
  }
  darkModeToggle.addEventListener('click', function() {
    setDarkMode(!document.body.classList.contains('dark-mode'));
  });
  // Initialize dark mode from localStorage
  if (localStorage.getItem('imgb64_dark') === '1') setDarkMode(true);

  // Clear button
  clearBtn.addEventListener('click', function() {
    base64Output.value = '';
    imagePreview.innerHTML = '';
    outputInfo.textContent = '';
    imageInput.value = '';
  });

  imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match('image.*')) {
      alert('Please upload a valid image file (JPG, PNG, GIF).');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
      const base64String = evt.target.result;
      base64Output.value = base64String;
      imagePreview.innerHTML = `<img src="${base64String}" alt="Preview">`;
      outputInfo.textContent = `Size: ${file.size} bytes | Type: ${file.type}`;
    };
    reader.readAsDataURL(file);
  });

  // Clipboard.js integration
  if (typeof ClipboardJS !== 'undefined') {
    new ClipboardJS(copyBtn, {
      text: function() {
        return base64Output.value;
      }
    });
    copyBtn.addEventListener('click', function() {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Base64'; }, 1200);
    });
  } else {
    copyBtn.addEventListener('click', function() {
      base64Output.select();
      document.execCommand('copy');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Base64'; }, 1200);
    });
  }

  downloadBtn.addEventListener('click', function() {
    downloadBtn.disabled = true;
    const blob = new Blob([base64Output.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image-base64.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => { downloadBtn.disabled = false; }, 1000);
  });
  const decodeBtn = document.getElementById('decodeBtn');
  const clearDecodeBtn = document.getElementById('clearDecodeBtn');
  const downloadDecodedBtn = document.getElementById('downloadDecodedBtn');
  const decodedImagePreview = document.getElementById('decodedImagePreview');
  const decodeInfo = document.getElementById('decodeInfo');
  const base64Input = document.getElementById('base64Input');

  // Set downloadDecodedBtn click handler once, outside any event
  // Helper: Save image using FileSaver.js if available, fallback otherwise
  function saveImageBlob(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], {type: mime});
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
    } else if (typeof saveAs !== 'undefined') {
      saveAs(blob, filename);
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 100);
    }
  }
  downloadDecodedBtn.onclick = function() {
    if (downloadDecodedBtn.disabled) return;
    downloadDecodedBtn.disabled = true;
    const img = decodedImagePreview.querySelector('img');
    if (img) {
      let ext = 'img';
      if (img.src.startsWith('data:image/png')) ext = 'png';
      else if (img.src.startsWith('data:image/jpeg')) ext = 'jpg';
      else if (img.src.startsWith('data:image/gif')) ext = 'gif';
      saveImageBlob(img.src, 'decoded-image.' + ext);
    }
    setTimeout(() => { downloadDecodedBtn.disabled = false; }, 1000);
  };
  // Decode Base64 to Image
  decodeBtn.addEventListener('click', function() {
    const base64 = base64Input.value.trim();
    if (!base64) {
      decodeInfo.textContent = 'Please paste a Base64 string.';
      decodedImagePreview.innerHTML = '';
      downloadDecodedBtn.style.display = 'none';
      return;
    }
    let imgSrc = base64;
    // Strictly extract base64 content and add prefix if missing
    if (!/^data:image\//.test(base64)) {
      // Remove any whitespace or line breaks
      const cleanBase64 = base64.replace(/\s+/g, '');
      // Try to detect image type (default to png)
      let mime = 'image/png';
      if (cleanBase64.substring(0,4) === '/9j/') mime = 'image/jpeg';
      else if (cleanBase64.substring(0,4) === 'R0lG') mime = 'image/gif';
      imgSrc = `data:${mime};base64,${cleanBase64}`;
    }
    const img = new Image();
    img.onload = function() {
      decodedImagePreview.innerHTML = '';
      decodedImagePreview.appendChild(img);
      decodeInfo.textContent = `Width: ${img.width}px | Height: ${img.height}px`;
      downloadDecodedBtn.style.display = '';
    };
    img.onerror = function() {
      decodedImagePreview.innerHTML = '';
      decodeInfo.textContent = 'Invalid Base64 image string.';
      downloadDecodedBtn.style.display = 'none';
    };
    img.src = imgSrc;
  });

  clearDecodeBtn.addEventListener('click', function() {
    base64Input.value = '';
    decodedImagePreview.innerHTML = '';
    decodeInfo.textContent = '';
    downloadDecodedBtn.style.display = 'none';
  });

  // Extra: Autofill decode from output
  base64Output.addEventListener('dblclick', function() {
    base64Input.value = base64Output.value;
    decodeInfo.textContent = 'Base64 copied from output.';
  });
});