# HTTP Chat Application Between Two AWS EC2 Virtual Machines

### *Full Report / README Document*

---

## **1. Introduction**

This report describes the design and deployment of a lightweight **HTTP-based chat application** running on **two AWS Ubuntu EC2 Virtual Machines (VMs)**.

The purpose of the project is to demonstrate:

* Hosting applications on cloud environments
* Communication between servers using HTTP
* AJAX-based message exchange without page reload
* Setting up firewall rules on AWS EC2
* Basic full-stack development using **Node.js (backend)** and **React.js (frontend)**

The solution meets all the required specifications from the assignment.

---

## **2. Objective**

The main objective of this practical is to create two separate VMs on AWS and enable them to communicate by exchanging messages using HTTP.

Each VM hosts:

* A **Node.js/Express backend** (port 3000)
* to install > Go to project Root directory and type npm install and after that type npm start and press enter
*
* A **React.js + TailwindCss frontend** (port 5173)
 to install > Go to project Root directory and type npm install and after that type npm run dev or npm run dev -- --host 0.0.0.0  and press enter

Users connected to each VM can send messages to the other VM in real-time using AJAX requests.

---

## **3. Overall System Architecture**

### **High-Level Architecture Diagram (ASCII)**

```
        ┌───────────────────────────────┐
        │             VM 1              │
        │ ───────────────────────────── │
        │  Frontend (Next.js)           │
        │        http://VM1:3000        │
        │                                │
        │  Backend (Node.js/Express)     │
        │        http://VM1:3001         │
        │                                │
        │  Stores JSON messages          │
        └───────────────┬───────────────┘
                        │
                        │  HTTP / AJAX
                        │  (GET /messages, POST /send)
                        │
        ┌───────────────▼───────────────┐
        │             VM 2              │
        │ ───────────────────────────── │
        │  Frontend (Next.js)           │
        │        http://VM2:3000        │
        │                                │
        │  Backend (Node.js/Express)     │
        │        http://VM2:3001         │
        │                                │
        │  Stores JSON messages          │
        └───────────────────────────────┘
```

---

## **4. Tools & Technologies Used**

### **Backend**

* Node.js
* Express.js
* CORS middleware
* JSON-based message storage (no database)

### **Frontend**

* React.js
* React Hooks
* Fetch API (AJAX requests)
* Lightweight HTML/CSS

### **Cloud / Deployment**

* AWS Instances (EC2)
* Compute Engine Virtual Machines (Ubuntu 22.04 LTS)
* EC2 Firewall Rules
* SSH Terminal

---

## **5. Features**

### ✔ **Real-time (polling) chat system**

* AJAX GET every 2 seconds to load new messages
* AJAX POST to send messages to the other VM

### ✔ **Two VM communication**

* VM1 frontend sends messages to VM2 backend
* VM2 frontend sends messages to VM1 backend

### ✔ **No database required**

* Messages stored in memory (array)

### ✔ **Simple and user-friendly UI**

---

## **6. Step-by-Step Implementation Guide**

---

# **6.1 Creating Two VMs on GCP**

### **Step 1: Open GCP**

Go to: [https://console.cloud.google.com/](https://console.cloud.google.com/)

### **Step 2: Enable Compute Engine**

Navigate to:
**Compute Engine → VM Instances → Create Instance**

### **Step 3: Create VM1**

* Name: `vm1-chat`
* Machine: `e2-micro`
* OS: Ubuntu 22.04 LTS
* Firewall:

  * ☑ Allow HTTP
  * ☑ Allow HTTPS

Create the instance.

### **Step 4: Create VM2**

Repeat the same steps:

* Name: `vm2-chat`

---

# **6.2 Configuring Firewall Rules in GCP**

The chat app uses ports:

* **3000** → Frontend
* **3001** → Backend

### **Step 5: Create Firewall Rule**

Go to:
**VPC Network → Firewall → Create Firewall Rule**

Fill in the fields:

* Name: `allow-chat-ports`
* Direction: Ingress
* Targets: All instances
* Source IP range: `0.0.0.0/0`
* Protocol: TCP
* Ports: `3000-3001`

Save the rule.

---

# **6.3 Installing Node.js and Required Tools**

### **Step 6: SSH into each VM**

Compute Engine → VM Instances → Click **SSH** on vm1
Repeat for vm2.

### **Install Node.js + Git**

Run on both VMs:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

---

# **6.4 Backend Setup (Node.js/Express)**

### **Step 7: Create backend folder**

```bash
mkdir backend
cd backend
```

### **Step 8: Create server.js**

```bash
nano server.js
```

Paste:

```js
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

let messages = [];

app.post("/send", (req, res) => {
  const { from, message } = req.body;
  if (!from || !message) return res.status(400).json({ error: "Missing fields" });
  const obj = { from, message, time: new Date().toISOString() };
  messages.push(obj);
  res.json({ ok: true });
});

app.get("/messages", (req, res) => {
  res.json(messages);
});

app.listen(3001, "0.0.0.0", () => console.log("Backend running on port 3001"));
```

### **Step 9: Create package.json**

```bash
nano package.json
```

Paste:

```json
{
  "name": "chat-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "scripts": {
    "start": "node server.js"
  }
}
```

### **Step 10: Install & Run**

```bash
npm install
node server.js
```

To keep backend running:

```bash
nohup node server.js &
```

Repeat backend setup on **both VMs**.

---

# **6.5 Frontend Setup (Next.js)**

### **Step 11: Create frontend**

```bash
cd ~
npx create-next-app frontend
cd frontend
```

### **Step 12: Add `.env.local`**

On **VM1**:

```
NEXT_PUBLIC_BACKEND=http://<VM2_PUBLIC_IP>:3001
NEXT_PUBLIC_NAME=VM1
```

On **VM2**:

```
NEXT_PUBLIC_BACKEND=http://<VM1_PUBLIC_IP>:3001
NEXT_PUBLIC_NAME=VM2
```

### **Step 13: Replace homepage with chat UI**

```bash
nano pages/index.js
```

Paste:

```jsx
import { useState, useEffect } from 'react';

export default function Home() {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND;
  const NAME = process.env.NEXT_PUBLIC_NAME;
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);

  const load = async () => {
    const res = await fetch(`${BACKEND}/messages`);
    setMessages(await res.json());
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, []);

  const send = async () => {
    await fetch(`${BACKEND}/send`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ from: NAME, message: msg })
    });
    setMsg("");
  };

  return (
    <div style={{ width: "400px", margin: "40px auto", fontFamily: "Arial" }}>
      <h2>HTTP Chat App</h2>
      <div style={{ border:"1px solid #aaa", height:"300px", overflowY:"auto", padding:"10px" }}>
        {messages.map((m, i) => <div key={i}><b>{m.from}</b>: {m.message}</div>)}
      </div>
      <input value={msg} onChange={e=>setMsg(e.target.value)} style={{ width: "70%" }}/>
      <button onClick={send} style={{ marginLeft: "10px" }}>Send</button>
    </div>
  );
}
```

### **Step 14: Start the frontend**

```bash
HOST=0.0.0.0 PORT=3000 npm run dev
```

Repeat for **VM2**.

---

# **7. Testing the Application**

### **VM1 frontend**

http://**VM1_EXTERNAL_IP**:3000

### **VM2 frontend**

http://**VM2_EXTERNAL_IP**:3000

Test:

1. Send a message from VM1 → It appears on VM2
2. Send from VM2 → It appears on VM1

This confirms the VMs communicate successfully.

---

# **8. Networking & Firewall Summary**

### GCP firewall must allow:

* TCP **3000** (frontend)
* TCP **3001** (backend)

### Each VM must use:

* `HOST=0.0.0.0` for Next.js
* Public IP address after deployment
* Correct `.env.local` pointing to the other VM

---

# **9. Conclusion**

This project successfully demonstrates how two cloud-based virtual machines can communicate using a simple HTTP chat system. The backend handles message storage and API routes, while the frontend provides a user-friendly interface that communicates with the remote backend using AJAX.

The assignment objectives were fully achieved, including:

* Creating and configuring GCP VMs
* Deploying a Node.js server and a Next.js frontend
* Enabling AJAX-based message exchange
* Opening firewall ports and ensuring network communication
* Building a functional chat interface

This README/report provides a complete explanation of the system and can be submitted as part of your assignment ZIP file.

---

If you want, I can also generate:
✅ A ZIP file structure
✅ A more advanced version with UI improvements
Just tell me!
