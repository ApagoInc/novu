//@ts-check
const fs = require('node:fs')


try {

  const [notifTemplatesJsonPath, messageTemplatesJsonPath] = [process.argv[2], process.argv[3]]

  console.log("Received notifTemplatesJsonPath:", notifTemplatesJsonPath)
  console.log("Received messageTemplatesJsonPath:", messageTemplatesJsonPath)


  // ./notification-templates-12-19-24.json
  const notifTemplates = fs.readFileSync(notifTemplatesJsonPath).toString()
  // parse JSON
  const notifTempsObj = JSON.parse(notifTemplates)


  // './message-templates-12-18-24.json'
  const msgTemplates = fs.readFileSync(messageTemplatesJsonPath).toString()
  // parse JSON
  const msgTempsObj = JSON.parse(msgTemplates)


  if (!notifTempsObj || !msgTempsObj) {
    throw new Error('Could not properly parse one or more of: notification template JSON, message template JSON')
  }

  // For all notification templates,
  // Get their steps' (in_app and email) template IDs
  // Then, use those template IDs to populate their text content

  const data = {}

  // We want an array of objects shaped like:
  const dataShape = {
    'notificationTemplateName': {
      in_app: 'text context of message template',
      email: 'text context of message template'
    }
  }

  const dupeCounts = {

  }


  for (let i = 0; i < notifTempsObj.length; i++) {
    const nt = notifTempsObj[i]
    console.log('Checking nt:', nt, 'at index', i)
    const name = nt.name

    console.log('nt has name:', name)
    let assignedName = ''
    if (!data[name]) {
      console.log('Adding newly-encountered nt at index', i, 'under its name:', name)
      assignedName = name
    } else {
      console.log('! - On nt:', nt, ' at index', i, '- found that one or more already exist under this name')

      if (!dupeCounts[name]) {
        dupeCounts[name] = 1
      } else {
        dupeCounts[name] += 1
      }

      const dupeName = `${name}_${dupeCounts[name]}`
      console.log('Since this is the case, naming this one to', dupeName)
      // throw new Error('Gathered data already had an entry for notification template: ' + nt.name)
      assignedName = dupeName
    }

    console.log("Adding new entry for nt:", nt.name)
    data[assignedName] = {}
    data[assignedName]._id = nt._id
    for (const step of nt.steps) {
      data[assignedName][step.name] = {
        templateId: step._templateId,
        content: ''
      }
      // For digests, also get the settings
      if (step.name === 'Digest') {
        data[assignedName][step.name] = {
          ...(step.metadata || {})
        }
      }
    }
  }


  console.log('Encountered the following counts of duplicates (not counting the original nt) -', JSON.stringify(dupeCounts))



  console.log('Initial prep complete - now proceeding to fill in all content values from the messsage templates')

  for (const [dataEntryName, dataEntry] of Object.entries(data)) {
    // Just check each by key since we know they're "In-App", "Email", or "Digest"
    for (const stepType of ['In-App', 'Email', 'Digest']) {

      console.log('Checking for content for', stepType, 'step of entry', dataEntryName)

      if (typeof dataEntry[stepType] !== undefined) {
        if (dataEntry[stepType] && typeof dataEntry[stepType].templateId !== 'undefined') {
          console.log('data entry has a templateId, going to search for it now')
          console.log('Trying to fill in content for', stepType, 'step of entry', dataEntryName)
          const matchingMt = msgTempsObj.find(mt => {
            if (mt._id === dataEntry[stepType].templateId) {
              console.log('Found matching template')
              return true;
            }
          })
          if (matchingMt) {
            if (typeof matchingMt.content !== 'undefined') {
              // content could be a string, an array, an object(?)
              if (typeof matchingMt.content === 'string') {
                dataEntry[stepType].content = matchingMt.content
              } else if (Array.isArray(matchingMt.content)) {
                dataEntry[stepType].content = Array.from(matchingMt.content)
              } else if (typeof matchingMt.content === 'object') {
                dataEntry[stepType].content = { ...matchingMt.content }
              }
              if (matchingMt.content === '') {
                console.log("NOTE: content was an empty string for mt:", matchingMt)
              }
            } else {
              console.log('matchingMt did not have any content to add. mt:', matchingMt)
            }
          } else {
            console.log('Could not find a matching mt for the following data entry and step type:', dataEntryName, '-', stepType)
          }
        } else {
          console.log('data entry did not have a templateId to search for')
        }

      } else {
        console.log('Did not encounter a step of type', stepType, 'on entry', dataEntryName, '- continuing')
      }
    }
  }
  // let i = 0; i < notifTempsObj.length; i++
  // for (let i = 0; i < msgTempsObj.length; i++) {

  //   console.log('Checking msg template', i + 1, 'of', msgTempsObj.length)

  // }


  // Another pass, to make sure that every 'content' property that is an array is just an array of length 1.
  // If that's the case, we will unpack the singular 'content' property nested in the array element, and use that as the value for content.

  console.log("Starting next pass over data, to refine results")


  for (const [dataEntryName, dataEntry] of Object.entries(data)) {
    // Just check each by key since we know they're "In-App", "Email", or "Digest"
    for (const stepType of ['In-App', 'Email', 'Digest']) {

      console.log('Checking the obtained content of ', stepType, 'step of entry', dataEntryName)

      const content = dataEntry[stepType] && dataEntry[stepType].content

      if (!content) {
        console.log('No content found for', stepType, 'step of entry', dataEntryName, '- Continuing.')
        continue;
      }

      if (Array.isArray(content)) {
        console.log(stepType, 'step of entry', dataEntryName, '- has an array for "content"')
        if (content.length > 1) {
          throw new Error('Found a content array property with length greater than 1; was of length ' + content.length + ' - ' + stepType + ' step of entry ' + dataEntryName + ' - ' + content)
        } else {
          console.log('content was of length', content.length)
          console.log("proceeding to unpack the content value as a string")
          const nestedContent = content[0].content
          if (nestedContent !== "" && !nestedContent) {
            console.log("!!! content array element had no nested content. Setting content to null.")
          }
          dataEntry[stepType].content = nestedContent || null
        }
      }

    }
  }


  // Now, we will start editing the templates in to the new config that we'll output.
  // We will start with this object, and fill all values in.

  const updatedTemplates = {
    TITLE_CREATED: {
      in_app: '',
      email: ''
    },
    TITLE_DELETED: {
      in_app: '',
      email: ''
    },
    COMPONENT_CREATED: {
      in_app: '',
      email: ''
    },
    // TODO - Correct these 4 (S) ones by removing the parens
    "FILE(S)_UPLOADED": {
      in_app: '',
      email: ''
    },
    COMPONENT_DELETED: {
      in_app: '',
      email: ''
    },
    "PAGE(S)_DELETED": {
      in_app: '',
      email: ''
    },
    TITLE_ARCHIVE_RETRIEVAL_REQUESTED: {
      in_app: '',
      email: ''
    },
    TITLE_RETRIEVED_FROM_ARCHIVE: {
      in_app: '',
      email: ''
    },
    TITLE_NOT_FOUND_IN_ARCHIVE: {
      in_app: '',
      email: ''
    },
    PREFLIGHT_WARNINGS_ERRORS: {
      in_app: '',
      email: ''
    },
    SPECIFICATIONS_WARNINGS_ERRORS: {
      in_app: '',
      email: ''
    },
    TITLE_REVIEW_REQUESTED: {
      in_app: '',
      email: ''
    },
    "PAGE_PROOF(S)_APPROVED": {
      in_app: '',
      email: ''
    },
    "PAGE_PROOF(S)_REJECTED": {
      in_app: '',
      email: ''
    },
    COMPONENT_PROOF_APPROVED: {
      in_app: '',
      email: ''
    },
    TITLE_READY_FOR_DELIVERY: {
      in_app: '',
      email: ''
    },
    USER_WAS_CREATED: {
      in_app: '',
      email: ''
    },
    USER_WAS_MODIFIED: {
      in_app: '',
      email: ''
    },
    USER_WAS_DELETED: {
      in_app: '',
      email: ''
    },
    RTO_PROOF_DOWNLOAD_READY: {
      in_app: '',
      email: ''
    },
    COMPONENT_CHECKED_IN: {
      in_app: '',
      email: ''
    },
    COMPONENT_CHECKOUT_COMPLETE: {
      in_app: '',
      email: ''
    },
    TITLE_CHECKOUT_COMPLETE: {
      in_app: '',
      email: ''
    },
    Preflight1_ApplyFix: {
      // Custom label to be used inside of the admin editor
      customLabel: '(Stakeholder1) - Resolve Preflight Issues',
      in_app: '',
      email: ''
    },
    Preflight1_Signoff: {
      customLabel: '(Stakeholder2) - Approve Content',
      in_app: '',
      email: ''
    },
    Preflight2_Signoff: {
      customLabel: '(Stakeholder3) - Approve to Print',
      in_app: '',
      email: ''
    },
  }





  // write these in unchanged, at the end
  const extras =
  {
    "resolve-preflight-complete": {
      customLabel: "(Stakeholder1a) Resolve Preflight Complete",
      in_app: "{{titleName}} - {{componentName}} - all preflight issues have been resolved by {{lastActorName}} S1a",
      email: "All preflight issues have been resolved by {{lastActorName}}<div>S1a</div>"
    },
    "approve-content-complete": {
      customLabel: '(Stakeholder2a) Approve Content Complete',
      in_app: "{{titleName}} - {{componentName}} page proof review has been completed by {{lastActorName}} S2a",
      email: "{{componentName}} page proof review has been completed by {{lastActorName}}<div>S2a</div>"
    },
    "approve-to-print-complete": {
      customLabel: "(Stakeholder 3a) Approve to Print Complete",
      in_app: "{{titleName}} - {{componentName}} has been approved to print by {{lastActorName}} S3a",
      email: " {{componentName}} has been approved to print by {{lastActorName}}<div>S3a</div>"
    }
  }



  // for each listed event above,
  // if there exists a name on the data list that, when spaces are replaced with underbars and the name is capitalized, 
  // they match -
  // then use that in app and email value for that item.

  const dataList = Object.entries(data)
  for (const [templateName, template] of Object.entries(updatedTemplates)) {

    const entryMatchByName = dataList.find(([dataEntryName, dataEntry]) => {

      const transformedDataName = dataEntryName.replaceAll(' ', '_').toUpperCase()

      console.log('Checking templateName', templateName, 'against dataEntryName', transformedDataName, `(${dataEntryName})`)

      if (templateName === transformedDataName) {
        console.log('Names match after transform.')

        return true;
      }
    })

    if (entryMatchByName) {

      template.in_app = entryMatchByName[1]?.["In-App"]?.content
      template.email = entryMatchByName[1]?.["Email"]?.content

      console.log('Set template to have the following:', template)
    }

  }




  const finalUpdatedOutput = { ...updatedTemplates, ...extras }



  const initialOutDataFile = './prepared-notif-templates-obj.json'
  fs.writeFileSync(initialOutDataFile, JSON.stringify(data))


  const updatedTemplatesFile = './updated-templates-obj.json'
  fs.writeFileSync(updatedTemplatesFile, JSON.stringify(finalUpdatedOutput))


  console.log('Script run complete, wrote initial output to', initialOutDataFile, ';\nwrote final output of updates to', updatedTemplatesFile)




} catch (e) {

  console.log('Error during script run:', e)
  console.log('\n\n[Script help]:\n\n node ./message-template-collater.js <path to notif templates json> <path to message templates json>\n\n')
  process.exitCode = 1

}
