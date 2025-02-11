
export default {
  // @ts-ignore
  async fetch(request, env, ctx) {
    const botToken = "";
    const chatId = "";

    const url = new URL(request.url);
    const domain = url.hostname;
    const pathParts = url.pathname.split("/");

    if (request.method === "GET" && url.pathname === "/") {
      // @ts-ignore
      const isBotTokenInvalid = !botToken || botToken === "<bot-token>";
      // @ts-ignore
      const isChatIdInvalid = !chatId || chatId === "<chat-id>";

      let warningMessage = "";
      if (isBotTokenInvalid) {
        warningMessage +=
          '<p style="color: red;">Warning: botToken is not defined</p>';
      }
      if (isChatIdInvalid) {
        warningMessage +=
          '<p style="color: red;">Warning: chatId is not defined</p>';
      }

      const htmlForm = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Upload</title>
            <link rel="icon" type="image/x-icon" href="https://uploadecenter.alisedighi959.workers.dev/download/AAMCBAADGQMAAypnjKxNAV-aVS-yKIC_DcriWXeH9wACFhUAAlOXaVAyZkvlm7EsPwEAB20AAzYE/thumbnails/file_50.webp">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
        
              body {
                background-color: #15181e;
                color: white;
                font-family: 'Arial', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                padding: 20px;
              }
        
              .container {
                background-color: #1f2229;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                text-align: center;
              }
        
              h1 {
                font-size: 2rem;
                margin-bottom: 20px;
              }
        
              input[type="file"] {
                display: block;
                margin: 20px auto;
                padding: 1rem;
                font-size: 1.2rem;
                background-color: #2b3038;
                color: white;
                border: none;
                border-radius: 5px;
                width: 100%;
                max-width: 400px;
                cursor: pointer;
              }
        
              button {
                font-size: 1.5rem;
                padding: 1rem 2rem;
                margin-top: 20px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;
              }
        
              button:hover {
                background-color: #45a049;
              }
        
              input[type="file"]:hover {
                background-color: #3b4048;
              }
  
  
  
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Upload a File</h1>
              ${warningMessage}
  <form action="/upload" method="POST" enctype="multipart/form-data">
    <input type="file" name="file" id="fileInput" accept="image/*,video/*" required />
    <div id="previewContainer" style="margin: 20px 0; text-align: center;">
      <img id="imagePreview" style="max-width: 100%; max-height: 300px; display: none;" />
      <video id="videoPreview" controls style="max-width: 100%; max-height: 300px; display: none;"></video>
    </div>
    <button type="submit">Upload</button>
  </form>
  
  <script>
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const previewContainer = document.getElementById('previewContainer');
  
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
  
      const fileType = file.type;
      const previewURL = URL.createObjectURL(file);
  
      // Reset previews
      imagePreview.style.display = 'none';
      videoPreview.style.display = 'none';
  
      if (fileType.startsWith('image/')) {
        imagePreview.src = previewURL;
        imagePreview.style.display = 'block';
      } else if (fileType.startsWith('video/')) {
        videoPreview.src = previewURL;
        videoPreview.style.display = 'block';
      }
    });
  </script>
  
            </div>
          </body>
        </html>
        `;

      return new Response(htmlForm, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (request.method === "GET" && pathParts[1] === "init") {
      const telegramResponse = await postReq("setWebhook", [
        { url: `https://${domain}/hook` },
      ]);
      const telegramResult = await telegramResponse.text();
      return new Response(telegramResult);
    }

    // Handle file download request
    if (pathParts[1] === "download" && pathParts[2]) {
      const fileResponse = await postReq(`getFile`, [
        { file_id: pathParts[2] },
      ]);

      const fileData = await fileResponse.json();
      const telegramFileResponse = await fetch(
        `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
      );

      // Modify response headers
      const newHeaders = new Headers(telegramFileResponse.headers);

      // Optionally change Content-Type if it's 'application/octet-stream'
      const contentType = newHeaders.get("Content-Type");
      if (contentType === "application/octet-stream") {
        newHeaders.set("Content-Type", ""); // Adjust or leave blank
      }

      newHeaders.delete("Content-Disposition"); // Prevent forced download

      return new Response(telegramFileResponse.body, { headers: newHeaders });
    }

    function extractFileIds(obj) {
      const fileIds = [];

      function searchForFileIds(item) {
        if (item && typeof item === "object") {
          // Check if the item has 'file_id'
          if (item.file_id) fileIds.push(item.file_id);

          // Recursively search through all object properties
          Object.values(item).forEach(searchForFileIds);
        } else if (Array.isArray(item)) {
          item.forEach(searchForFileIds);
        }
      }

      searchForFileIds(obj);
      const uniquefileIds = [...new Set(fileIds)];
      return uniquefileIds;
    }

    async function postReq(url, fields) {
      const tgFormData = new FormData();

      fields.forEach((obj) => {
        for (let key in obj) {
          tgFormData.append(key, obj[key]);
        }
      });

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/${url}`,
        {
          method: "POST",
          body: tgFormData,
        }
      );

      return await telegramResponse;
    }

    if (url.pathname === "/hook" && ["POST", "PUT"].includes(request.method)) {
      const json = await request.json();
      const fileIds = extractFileIds(json);
      if (fileIds.length > 0) {
        const downloadLinks = await Promise.all(
          fileIds.map(async (fid) => {
            const fileResponse = await postReq(`getFile`, [{ file_id: fid }]);

            const fileData = await fileResponse.json();

            if (fileData.ok) {
              return `https://${domain}/download/${fid}/${fileData.result.file_path}`;
            } else {
              await postReq(`sendMessage`, [
                { chat_id: json.message.from.id },
                { text: "error" },
                { parse_mode: "MarkdownV2" },
                { reply_to_message_id: json.message.message_id },
              ]);
              return false;
            }
          })
        );

        let msg = [];
        for (const item of downloadLinks) {
          if (item) {
            msg.push(`Download Link: \`${item}\``);
          }
        }

        if (msg.length > 0) {
          await postReq(`sendMessage`, [
            { chat_id: json.message.from.id },
            { text: msg.join("\n\n") },
            { parse_mode: "MarkdownV2" },
            { reply_to_message_id: json.message.message_id },
          ]);
        }
      } else {
        if (
          "text" in json.message &&
          json.message.text.toLowerCase().includes("chatid")
        ) {
          await postReq(`sendMessage`, [
            { chat_id: json.message.from.id },
            { text: `your chatId is: \`${json.message.from.id}\`` },
            { parse_mode: "MarkdownV2" },
            { reply_to_message_id: json.message.message_id },
          ]);
        } else if (
          "text" in json.message &&
          json.message.text.includes("/start")
        ) {
          await postReq(`sendMessage`, [
            { chat_id: json.message.from.id },
            { text: "Welcome!" },
          ]);
        } else {
          await postReq(`sendMessage`, [
            { chat_id: json.message.from.id },
            { text: "send me a file" },

            { reply_to_message_id: json.message.message_id },
          ]);
        }
      }
      return new Response("");
    }

    if (url.pathname === "/upload" && request.method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file");

      if (file) {
        const sendFileToChat = await postReq("sendDocument", [
          { chat_id: chatId },
          { document: file },
        ]);

        const sendFileToChatResponse = await sendFileToChat.json();

        if (sendFileToChat.ok) {
          const fileIds = extractFileIds(sendFileToChatResponse);

          const downloadLinks = await Promise.all(
            fileIds.map(async (fid) => {
              const fileResponse = await postReq(`getFile`, [{ file_id: fid }]);

              const fileData = await fileResponse.json();
              if (fileData.ok) {
                return `https://${domain}/download/${fid}/${fileData.result.file_path}`;
              } else {
                await postReq(`sendMessage`, [
                  { chat_id: chatId },
                  { text: "error" },
                  { parse_mode: "MarkdownV2" },
                ]);

                return false;
              }
            })
          );

          let msg = [];

          for (const itemx of downloadLinks) {
            if (itemx) {
              msg.push(`Download Link: \`${itemx}\``);
            }
          }

          if (msg.length > 0) {
            await postReq("editMessageCaption", [
              { chat_id: chatId },
              { message_id: sendFileToChatResponse["result"]["message_id"] },
              { parse_mode: "MarkdownV2" },
              { caption: msg.join("\n\n") },
            ]);
          }

          const html = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Uploads</title>
                <style>
                  body {
                    background-color: #15181e;
                  }
                  .container {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem;
                  }
                  .item {
                    display: flex;
                    flex-direction: column;
                    text-align: left;
                    padding: 1rem;
                    color: white;
                    border-radius: 8px;
                    border: 1px solid green;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    background-color: white;
                  }
                  .link {
                    color: black;
                    text-align: left;
                    padding: 1rem;
                    letter-spacing: 1px;
                    font-size: 14px;
                  }
                  .dllink {
                    color: green;
                    margin: 1rem 1rem 0rem 1rem;
                    font-weight: bold;
                    font-size: 1.5rem;
                  }
                  .image-preview {
                    max-width: 100px;
                    max-height: 100px;
                   
                    border: 1px solid #ddd;
                    border-radius: 8px;
                  }
  
                  .image-size {
                    font-size: 12px;
                    color: black;
                    margin-top: 0.5rem;
                  }
  
                </style>
              </head>
              <body>
            
                <h1 style="color:#c0b6ff;margin-left:2rem">My Uploads</h1>
            
                <div class="container">
            
                  ${downloadLinks
                    .map((url) => {
                      // Check file extension for image types
                      const fileExtension = url.split(".").pop().toLowerCase();
                      const imageExtensions = ["jpg", "jpeg", "png", "webp"];
                      const isImage = imageExtensions.includes(fileExtension);

                      // Set the preview image, either the actual image or a generic icon
                      const previewImage = isImage
                        ? url
                        : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABPCAMAAABs4TM5AAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAASxQTFRF/////v7+9vb26Ojo3t7e2dnZ2NjY5ubm9/f3/f392tranJycgICAdnZ2c3NzpKSktbW1t7e3kZGRdHR0dXV1mJiYvb29srKy1NTUy8vLe3t7oqKi1dXVeXl5tLS0+fn5kJCQxcXF09PT+vr6mZmZ6enpenp6xsbGzs7OwsLCzc3NzMzM/Pz8s7OzoKCgk5OTfn5+u7u7o6Ojm5ub7e3tiYmJr6+vf39/7OzsfHx8g4OD0tLS5+fnsbGxx8fH9fX1j4+Pl5eXioqK5OTk7+/v7u7uyMjI4ODgq6urjY2N+Pj4d3d3gYGBfX193Nzc3d3dp6enw8PDi4uLz8/PlZWV8/Pz9PT08vLy0NDQgoKCjIyMpqamhoaG39/flJSU29vbh4eHtra24uLi+/v77g8zIgAAAlNJREFUeJztmM9PE0EUx98zrUxty6VRoJYY0hREjXohGA/KASmJ/4AX+c+8mqhc4dJwaZFowIM/+HERYoLBkAYsEOq2tmOn2N1t9/XNbPbSkH6THnZ3vp+dN327++Yh2MKmgJa8gn/IC7YhwtmVH61zDhAa7O5uzk79fnUF4DBWGDvAQFWNCu93A4yEyqz/AgCi7iU0AaHIAO//D6CiUIBbeKbxtwBEFAowdqrz2wDA6K4HkMbf5gDPHBqADB75AHSuZAOQOrnqB9ARRQMwUeRSyAsAcW2nDTB56BMAonoQDAAithUMACKO3wIBYKi2FQxgr6QhIOl9kkV80wfg5oH33MUcDAEp/EkQVE4aAqAcJU4K/GEMiFwn3kajuGEMAOt2reO1dRhP4AdzgJpFre0wdpSR/gAe9QF9QB/QHcAXKg25P4MEYBxrf1m/wG0OIO/qo2l9UUhAJTmk8xeefmUAcJ8t9tT98ZMzglrESJIHWN9d9Vhv5sFlAFgak7soJgCZ0ijvX5ld5/Kg8lAbTSG7zgECp3IsE9YAdtMfOQBYcob145prcI/mwSUASI3JPZZK5bjgp7P8fJUDyCf67VMizwAqz4o6fyHhBEmEMPNZ8zghnrKpLOfwmAUUS64geyYPTPaNtB5ZOdOdK617+brp3plW9rU03b3TupM37h+Qmq++Me5gUJI3VLHS/AOya7oeCqV6uQzGXRxCU7F3YAO0fSSPZCq8AQ4A4CUu+Umn6fdzb6ENALiwyPTS3AonHuN+zvY5FxDTewaI0IsvD145h/8A56YfXwdUMPEAAAAASUVORK5CYII=";

                      return `
                      <div class="item">
                      
                      <img src="${previewImage}" class="image-preview" alt="File Preview" onload="displayImageSize(this)">
                      <div class="image-size" data-size></div> 
                      <div class="dllink">Download Link:</div>
                        
                        <div class="link">${url}</div>
                      </div>`;
                    })
                    .join("")}
            
                </div>
            
                <script>
                function displayImageSize(imgElement) {
                  if (imgElement.src.startsWith('data:image/png;base64')) return; // Skip for non-images
                  const width = imgElement.naturalWidth;
                  const height = imgElement.naturalHeight;
                  const sizeElement = imgElement.parentElement.querySelector('[data-size]');
                  sizeElement.textContent = \`\${width} X \${height}\`;
                }
              </script>
  
              </body>
            </html>
            
  
          `;

          return new Response(html, {
            headers: { "content-type": "text/html;charset=UTF-8" },
          });
        } else {
          return new Response(`Failed`, { status: 500 });
        }
      } else {
        return new Response("No file uploaded", { status: 400 });
      }
    }
  },
};
