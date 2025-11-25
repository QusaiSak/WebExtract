async function executeExtractDataWithAI(params: any, environment: any) {
  const { prompt, content } = params

  try {
    environment.log.info('Starting AI extraction...')
    
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI extraction timeout after 60s')), 60000)
    })

    const extractionPromise = (async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a data extraction assistant. Extract information according to the user prompt.',
            },
            {
              role: 'user',
              content: `Content:\n${content}\n\nExtraction prompt: ${prompt}`,
            },
          ],
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    })()

    const extractedData = await Promise.race([extractionPromise, timeoutPromise])

    environment.log.success('AI extraction completed')
    return extractedData
  } catch (error: any) {
    environment.log.error(`AI extraction failed: ${error.message}`)
    throw error
  }
}