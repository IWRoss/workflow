module.exports = {
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "*Opportunity*\n",
        },
        {
          type: "mrkdwn",
          text: "*Project Code*\n",
        },
        
         
      ],
      
    },
    
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Create Monday Task",
            emoji: true,
          },
          value: "",
          action_id: "createTask",
          style: "primary",
        },
       
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View on Copper",
            emoji: true,
          },
          url: "",
          action_id: "viewOnCopper",
        },
       {
          type: "button",
          text: {
            type: "plain_text",
            text: "No action required",
            emoji: true,
          },
          value: "noActionRequired", 
          action_id: "noActionRequired",
          style: "danger",
        },
      ],
    },
  ],
};
