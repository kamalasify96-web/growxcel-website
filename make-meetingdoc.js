const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
  LevelFormat, PageNumber, Header, Footer, PageBreak
} = require('docx');
const fs = require('fs');

// ── COLOURS ──────────────────────────────────────────────────────────────────
const NAVY   = "082F73";
const BLUE   = "4A7FD4";
const GREEN  = "16A34A";
const RED    = "DC2626";
const GREY   = "F3F4F6";
const MIDGREY= "6B7280";
const DARK   = "111827";

// ── HELPERS ───────────────────────────────────────────────────────────────────
const border = (color = "E5E7EB") => ({ style: BorderStyle.SINGLE, size: 1, color });
const borders = (color = "E5E7EB") => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorders = () => ({ top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } });

function cell(children, { fill = "FFFFFF", width = 9360, bold = false, color = DARK, shade = false } = {}) {
  return new TableCell({
    borders: borders(),
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 160, right: 160 },
    children: Array.isArray(children) ? children : [new Paragraph({ children: [new TextRun({ text: children, bold, color, font: "Arial", size: 22 })] })],
  });
}

function heading1(text) {
  return new Paragraph({
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 6 } },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 32, color: NAVY })]
  });
}

function heading2(text, color = NAVY) {
  return new Paragraph({
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 26, color })]
  });
}

function body(text, { bold = false, color = DARK, size = 22, spacing = 80 } = {}) {
  return new Paragraph({
    spacing: { before: 40, after: spacing },
    children: [new TextRun({ text, bold, font: "Arial", size, color })]
  });
}

function bullet(text, { bold = false, firstBold = null } = {}) {
  const parts = [];
  if (firstBold && text.startsWith(firstBold)) {
    parts.push(new TextRun({ text: firstBold, bold: true, font: "Arial", size: 22, color: DARK }));
    parts.push(new TextRun({ text: text.slice(firstBold.length), font: "Arial", size: 22, color: DARK }));
  } else {
    parts.push(new TextRun({ text, bold, font: "Arial", size: 22, color: DARK }));
  }
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 60 },
    children: parts
  });
}

function subBullet(text) {
  return new Paragraph({
    numbering: { reference: "subbullets", level: 0 },
    spacing: { before: 20, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 20, color: MIDGREY })]
  });
}

function space(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun("")] }));
}

function labelRow(label, value, labelColor = BLUE) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 7560],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: noBorders(),
        width: { size: 1800, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 0, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "Arial", size: 20, color: labelColor })] })]
      }),
      new TableCell({
        borders: noBorders(),
        width: { size: 7560, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 0, right: 0 },
        children: [new Paragraph({ children: [new TextRun({ text: value, font: "Arial", size: 20, color: DARK })] })]
      }),
    ]})],
  });
}

function calloutBox(title, lines, { fillColor = GREY, titleColor = NAVY } = {}) {
  const children = [
    new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: title, bold: true, font: "Arial", size: 22, color: titleColor })] }),
    ...lines.map(l => new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { before: 20, after: 40 },
      children: [new TextRun({ text: l, font: "Arial", size: 20, color: DARK })]
    }))
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: borders("D1D5DB"),
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: fillColor, type: ShadingType.CLEAR },
      margins: { top: 140, bottom: 140, left: 200, right: 200 },
      children,
    })]})]
  });
}

function twoColTable(rows, widths = [3600, 5760]) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(([left, right, isHeader]) => new TableRow({
      children: [
        new TableCell({
          borders: borders(),
          width: { size: widths[0], type: WidthType.DXA },
          shading: { fill: isHeader ? "1E3A5F" : (left.fill || "FFFFFF"), type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: left.text || left, bold: isHeader || left.bold, font: "Arial", size: isHeader ? 20 : 22, color: isHeader ? "FFFFFF" : (left.color || DARK) })] })]
        }),
        new TableCell({
          borders: borders(),
          width: { size: widths[1], type: WidthType.DXA },
          shading: { fill: isHeader ? "1E3A5F" : (right.fill || "FFFFFF"), type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: right.text || right, bold: isHeader || right.bold, font: "Arial", size: isHeader ? 20 : 22, color: isHeader ? "FFFFFF" : (right.color || DARK) })] })]
        }),
      ]
    }))
  });
}

// ── DOCUMENT ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] },
      { reference: "subbullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 280 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 6 } },
        spacing: { after: 0 },
        children: [
          new TextRun({ text: "GROWXCEL  |  INTRO MEETING PREP", bold: true, font: "Arial", size: 18, color: NAVY }),
          new TextRun({ text: "\tCONFIDENTIAL", font: "Arial", size: 18, color: MIDGREY }),
        ],
        tabStops: [{ type: "right", position: 9360 }]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 6 } },
        spacing: { before: 0 },
        children: [
          new TextRun({ text: "Prepared by Wavz Studio  —  June 2026", font: "Arial", size: 16, color: MIDGREY }),
          new TextRun({ text: "\tPage ", font: "Arial", size: 16, color: MIDGREY }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: MIDGREY }),
        ],
        tabStops: [{ type: "right", position: 9360 }]
      })] })
    },
    children: [

      // ═══════════════════════════════════════════════════════════
      // COVER / TITLE BLOCK
      // ═══════════════════════════════════════════════════════════
      new Paragraph({
        spacing: { before: 240, after: 60 },
        children: [new TextRun({ text: "MEETING PREP DOCUMENT", bold: true, font: "Arial", size: 20, color: BLUE, characterSpacing: 80 })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 100 },
        children: [new TextRun({ text: "Growxcel — Introductory Client Meeting", bold: true, font: "Arial", size: 48, color: NAVY })]
      }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 2200, 2200, 2760],
        rows: [new TableRow({ children: [
          new TableCell({ borders: noBorders(), width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 0, right: 160 }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, children: [
            new Paragraph({ children: [new TextRun({ text: "DATE", bold: true, font: "Arial", size: 18, color: MIDGREY })] }),
            new Paragraph({ children: [new TextRun({ text: "June 2026", font: "Arial", size: 22, color: DARK })] }),
          ]}),
          new TableCell({ borders: noBorders(), width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 0, right: 160 }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, children: [
            new Paragraph({ children: [new TextRun({ text: "CLIENT", bold: true, font: "Arial", size: 18, color: MIDGREY })] }),
            new Paragraph({ children: [new TextRun({ text: "Dr. Rabab Mostafa", font: "Arial", size: 22, color: DARK })] }),
          ]}),
          new TableCell({ borders: noBorders(), width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 0, right: 160 }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, children: [
            new Paragraph({ children: [new TextRun({ text: "TYPE", bold: true, font: "Arial", size: 18, color: MIDGREY })] }),
            new Paragraph({ children: [new TextRun({ text: "Introductory", font: "Arial", size: 22, color: DARK })] }),
          ]}),
          new TableCell({ borders: noBorders(), width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 0, right: 0 }, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, children: [
            new Paragraph({ children: [new TextRun({ text: "OBJECTIVE", bold: true, font: "Arial", size: 18, color: MIDGREY })] }),
            new Paragraph({ children: [new TextRun({ text: "Sign them as a client", font: "Arial", size: 22, color: DARK })] }),
          ]}),
        ]})]
      }),
      ...space(1),
      calloutBox("⚠️  The Big Context", [
        "They do NOT know you have already built their website, brand guidelines, and social posts.",
        "This is your secret weapon. You built it on spec to show genuine belief in their brand.",
        "Do NOT reveal this at the start. Build up to it — see Section 4 for the reveal strategy.",
      ], { fillColor: "FFF7ED", titleColor: "92400E" }),

      ...space(1),
      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════════════════════
      // SECTION 1: WHO YOU ARE MEETING
      // ═══════════════════════════════════════════════════════════
      heading1("1.  Who You Are Meeting"),
      ...space(1),

      heading2("Dr. Rabab Mostafa — CEO, Growxcel"),
      twoColTable([
        [{ text: "Field", bold: true }, { text: "Details", bold: true }, true],
        ["Company", "Growxcel"],
        ["Role", "Founder & CEO"],
        ["Experience", "30+ years in F&B financial consulting"],
        ["Markets", "Egypt, Saudi Arabia, UAE"],
        ["Core service", "Cost structure analysis & profitability systems"],
        ["Key message", "“We fix the system — not the symptom”"],
      ]),
      ...space(1),

      heading2("What Growxcel Does"),
      body("Growxcel helps F&B businesses (restaurants, groups, hotel F&B) identify and fix the hidden cost leaks that drain profit — without cutting staff, changing menus, or disrupting operations. They audit the real cost structure, rebuild the tracking systems, and recover the margin."),
      ...space(1),

      heading2("The Problem They Solve"),
      bullet("Most F&B owners know their revenue but not their real cost per dish"),
      bullet("42% of revenue going to costs is common — most of it invisible"),
      bullet("The fix isn’t cutting corners — it’s fixing the data systems that track what things cost"),
      bullet("Proven result: Saudi restaurant group went from 42% → 31% cost ratio in 6 months, zero operational disruption"),
      ...space(1),

      calloutBox("Why This Matters for Your Pitch", [
        "Dr. Rabab is a credentialed expert with a proven track record. She doesn’t need to be sold on her own expertise.",
        "What she likely needs: visibility, credibility, a stronger digital presence, and content that converts her expertise into clients.",
        "Your job today: position yourself as the person who can build that for her — and then show her you already have.",
      ], { fillColor: "EFF6FF", titleColor: NAVY }),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════════════════════
      // SECTION 2: OPENING THE MEETING
      // ═══════════════════════════════════════════════════════════
      heading1("2.  How to Open the Meeting"),
      ...space(1),
      body("Start warm, curious, and consultative. You are NOT pitching yet. You are asking questions and listening. The goal of the first 5–10 minutes is to make her feel heard."),
      ...space(1),

      heading2("Opening Line (use something like this)"),
      calloutBox("What to say:", [
        "“Thank you for taking the time — I’ve been doing some research on Growxcel and I’m genuinely excited about what you’re building. Before I talk about anything I do, I’d love to understand where you are right now and where you want to take the brand — is that okay?”",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),
      ...space(1),

      body("Then go straight into discovery questions (Section 3). Don’t pitch yet. Let her talk."),
      ...space(1),

      heading2("Tone Calibration"),
      twoColTable([
        [{ text: "Do", bold: true }, { text: "Don’t", bold: true }, true],
        ["Be warm, direct, confident", "Over-explain yourself upfront"],
        ["Ask one question at a time", "Talk more than she does in the first half"],
        ["Take notes visibly (shows respect)", "Jump to solutions before she’s finished"],
        ["Use her language back to her", "Use jargon she didn’t introduce first"],
        ["Pause after she speaks", "Rush to fill silences"],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════════════════════
      // SECTION 3: DISCOVERY QUESTIONS
      // ═══════════════════════════════════════════════════════════
      heading1("3.  Discovery Questions"),
      ...space(1),
      body("These are your listening tools. Each one is designed to surface a pain point you can then solve. Let her answer fully before moving on."),
      ...space(1),

      heading2("About the Brand & Current Presence"),
      bullet("Tell me about Growxcel — how did it start and where is it today?"),
      bullet("How are clients currently finding you? Is it mostly referrals or are you doing anything digital?"),
      bullet("When someone Googles Growxcel right now, what do they find?"),
      bullet("Do you have a website? How happy are you with how it represents you?"),
      bullet("What does your social media presence look like — are you active on LinkedIn, Instagram?"),
      ...space(1),

      heading2("About Their Goals"),
      bullet("Where do you want Growxcel to be in 12 months — geographically, in terms of clients, in terms of reputation?"),
      bullet("Is the priority more inbound leads, or building credibility and authority in the market?"),
      bullet("Are you looking to grow in a specific market — Saudi, Egypt, UAE — or all three equally?"),
      bullet("What would it look like if your digital presence was working really well for you?"),
      ...space(1),

      heading2("About Their Frustrations"),
      bullet("What’s the biggest frustration you have with how your brand is being presented right now?"),
      bullet("Have you worked with anyone on branding or digital before? What happened?"),
      bullet("If you’re honest, what’s the gap between how Growxcel is perceived and how it deserves to be perceived?"),
      ...space(1),

      heading2("The Qualifying Question (ask this near the end of discovery)"),
      calloutBox("Key question:", [
        "“If I came back to you with a full brand and digital strategy — something that genuinely elevated how Growxcel shows up — is that something you’d want to move forward on quickly, or is the timing not right yet?”",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),
      body("This tells you where her head is before you reveal the assets. If she says yes — you have your moment."),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════════════════════
      // SECTION 4: THE REVEAL
      // ═══════════════════════════════════════════════════════════
      heading1("4.  The Reveal Strategy — Your Secret Weapon"),
      ...space(1),

      calloutBox("What you’ve already built (she doesn’t know this):", [
        "Full brand guidelines — logo variants, color system, typography, usage rules",
        "Complete website — static HTML/CSS/JS, dark premium aesthetic, Terminal Industries-style",
        "3 Instagram posts (Expert Insight, Proof, Founder’s Note) — all on-brand, ready to publish",
        "1 motion graphics video — 9:16 explainer for Reels, animated in Seedance 2.0",
      ], { fillColor: "FFF7ED", titleColor: "92400E" }),
      ...space(1),

      heading2("When to Reveal"),
      body("After she has expressed a desire for better branding/digital. After she has answered your qualifying question with interest. Then:"),
      ...space(1),

      calloutBox("What to say at the reveal moment:", [
        "“So I’ll be honest with you — I was so interested in what Growxcel is doing that before this meeting, I put some time into actually building out what I thought the brand could look like. I want to show you something.”",
        "Then open the laptop and show: brand guidelines first, then website, then posts, then video.",
        "Don’t over-explain. Let her react. Watch her face.",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),
      ...space(1),

      heading2("Reveal Order"),
      twoColTable([
        [{ text: "Step", bold: true }, { text: "What to show & say", bold: true }, true],
        ["1. Brand Guidelines", "\"This is the identity system I built for Growxcel — the colors, the fonts, how the logo works across backgrounds.\""],
        ["2. Website", "\"This is a full website concept — homepage, services, the works. Dark, premium, very different from what most consulting firms look like.\""],
        ["3. Instagram Posts", "\"Three posts — Expert Insight, a client result post, and a founder quote. All built with your brand fonts and colors.\""],
        ["4. Video", "\"And this is a motion graphics video explaining what Growxcel does — the problem, the process, the result. Ready for Reels.\""],
      ]),
      ...space(1),

      calloutBox("After the reveal — what to say:", [
        "“This is just a starting point. Everything here is yours to approve, change, or scrap. I built it because I genuinely believe in what you’re building and I wanted to show you, not just tell you, what I can do for Growxcel.”",
      ], { fillColor: "EFF6FF", titleColor: NAVY }),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════════════════════
      // SECTION 5: OBJECTION HANDLING
      // ═══════════════════════════════════════════════════════════
      heading1("5.  Objection Handling"),
      ...space(1),

      heading2("“Why is everything so dark?”"),
      body("This is the most likely design pushback. Here’s your answer:", { bold: false }),
      calloutBox("What to say:", [
        "“The dark is intentional — it’s actually in the brand guidelines as your primary identity. Here’s why it works for you: the F&B world is full of warm tones, food photography, lifestyle imagery. A sharp black brand stands out completely. More importantly, the dark background is what makes the data POP — the red 42%, the green 31%, the numbers. On white it looks like a PowerPoint. On black it looks like a Bloomberg terminal. It signals you’re serious.”",
        "If she’s still unsure: “I can absolutely show you a light version side by side — but I’d want you to see them both before deciding.”",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),
      ...space(1),

      heading2("“How much does this cost?”"),
      calloutBox("What to say:", [
        "“I want to make sure whatever I propose is right for where you are and where you’re going. Can you tell me a bit about your budget expectations first? That way I can put together something that makes sense rather than guessing.”",
        "Don’t give a number first. Let her anchor. Then work from there.",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),
      ...space(1),

      heading2("“I need to think about it”"),
      calloutBox("What to say:", [
        "“Absolutely — and I don’t want you to feel any pressure. Can I ask what specifically you’d be thinking through? That way I can make sure anything I send you addresses exactly that.”",
        "Then listen. There is always a specific concern under “I need to think about it.” Surface it.",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),
      ...space(1),

      heading2("“We’re already working with someone else”"),
      calloutBox("What to say:", [
        "“That’s totally fine — and honestly if it’s working well, you should stick with it. Can I ask — what does that relationship cover? Sometimes people find it makes sense to have a dedicated person for social and content, separate from whoever handles the broader stuff.”",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),
      ...space(1),

      heading2("“The website looks too minimal / not enough content”"),
      calloutBox("What to say:", [
        "“You’re right — this is a concept, not the final version. The structure and identity are there; we’d fill it in with your actual case studies, your team, your services in detail. The bones are built; the content is yours to add.”",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════════════════════
      // SECTION 6: WHAT YOU ARE SELLING
      // ═══════════════════════════════════════════════════════════
      heading1("6.  What You’re Offering"),
      ...space(1),
      body("Frame it as a complete brand and digital partnership, not individual deliverables. Sell the outcome, not the output."),
      ...space(1),

      heading2("The Core Offer"),
      twoColTable([
        [{ text: "Deliverable", bold: true }, { text: "What it means for her", bold: true }, true],
        ["Brand identity system", "A complete, professional brand she can use everywhere — never look inconsistent again"],
        ["Website", "A 24/7 sales tool that does the credibility work before any meeting happens"],
        ["Instagram content system", "3–4 posts per month, on-brand, ready to publish — she approves, you deliver"],
        ["Short-form video (Reels)", "Motion graphics content that explains her value proposition in 10 seconds"],
        ["Ongoing support", "One point of contact for anything brand or digital — no agencies, no handoffs"],
      ]),
      ...space(1),

      heading2("The Positioning Line (use this)"),
      calloutBox("What to say:", [
        "“Most consultants are invisible online. They have a LinkedIn and maybe a basic website, and they rely entirely on word of mouth. That works until it doesn’t. What I want to build for Growxcel is a digital presence that makes Dr. Rabab the obvious choice — so when someone Googles F&B cost consulting in Riyadh, or sees a post, or gets referred — they already trust you before they’ve spoken to you.”",
      ], { fillColor: "EFF6FF", titleColor: NAVY }),

      new Paragraph({ children: [new PageBreak()] }),

      // ═══════════════════════════════════════════════════════════
      // SECTION 7: CLOSING
      // ═══════════════════════════════════════════════════════════
      heading1("7.  How to Close the Meeting"),
      ...space(1),

      heading2("What You Want to Walk Away With"),
      bullet("Her verbal agreement to move forward, OR"),
      bullet("A specific follow-up — a proposal, a second meeting, a call with a decision-maker"),
      bullet("Never leave without a clear next step with a date attached"),
      ...space(1),

      heading2("Closing Question"),
      calloutBox("What to say:", [
        "“Based on what you’ve seen today, does this feel like the direction you want to go? I can put together a formal proposal this week with a clear scope and investment — or if you’re ready, we can start talking about timing today.”",
      ], { fillColor: "F0FDF4", titleColor: GREEN }),
      ...space(1),

      heading2("Next Steps Template"),
      twoColTable([
        [{ text: "If she says YES", bold: true }, { text: "If she says MAYBE / needs proposal", bold: true }, true],
        ["Agree on scope and timeline today", "Send a written proposal within 48 hours"],
        ["Set a start date", "Include: scope, timeline, investment, payment terms"],
        ["Agree on first deliverable", "Book a follow-up call to walk through the proposal"],
        ["Confirm contact + comms channel", "Give a deadline for the proposal decision"],
      ]),
      ...space(1),

      calloutBox("✔  Before You Leave the Meeting — Confirm These:", [
        "What is the agreed next step?",
        "Who is the decision maker (is it her alone)?",
        "What is the timeline she is working to?",
        "What email / WhatsApp to send follow-up to?",
        "Did you get her honest reaction to the assets?",
      ], { fillColor: GREY, titleColor: NAVY }),

      ...space(2),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 8 } },
        children: [new TextRun({ text: "You built the brand on spec. That’s your credibility. Show it with confidence.", bold: true, font: "Arial", size: 22, color: NAVY, italics: true })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/wavzstudio/Desktop/wavz tech/Growxcel-Meeting-Prep.docx", buffer);
  console.log("Done: Growxcel-Meeting-Prep.docx");
});
