import base64
from openai import AsyncOpenAI
from config import OPENAI_API_KEY

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


async def generate_thumbnail(prompt: str, style_prompt: str, headshot_url: str) -> bytes:
    """Generate a PNG thumbnail using the supplied reference image URL."""

    if client is None:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    full_prompt = (
        f"{style_prompt}\n\n"
        f"User request: {prompt}\n\n"
        "The generated thumbnail must prominently feature the person in the reference "
        "image. Preserve their identity and likeness accurately. Do not add logos or "
        "watermarks. Return a finished YouTube thumbnail composition."
    )

    content = [{"type": "input_text", "text": full_prompt}]
    if headshot_url:
        content.insert(0, {"type": "input_image", "image_url": headshot_url})

    response = await client.responses.create(
        model="gpt-4.1-mini",
        input=[{"role": "user", "content": content}],
        tools=[{"type": "image_generation", "size": "1536x1024", "quality": "high"}],
    )

    for item in response.output:
        if getattr(item, "type", None) == "image_generation_call":
            result = getattr(item, "result", None)
            if result:
                return base64.b64decode(result)

    raise RuntimeError("OpenAI returned no generated image")


## GEMINI

# import httpx
# from google import genai
# from google.genai import types

# from config import GEMINI_API_KEY

# client= genai.Client(api_key=GEMINI_API_KEY)

# async def generate_thumbnail(prompt: str, style_prompt: str, headshot_url: str) -> bytes:
#     """
#     Use the Responses API with gemini as a built-in image generation tool
#     Pass the headshot url directly as input image
#     Return raw png bytes
#     """

#     full_prompt= (
#         f"{style_prompt}\n\n"
#         f"User Request: {prompt}\n\n"
#         "IMPORTANT: The generated thumbnail must prominently feature the person shown in the provided reference headshot photo. Keep their likeness accurate."
#     )

#     async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as http:
#         image_response = await http.get(headshot_url)
#         image_response.raise_for_status()

#         headshot_bytes = image_response.content
#         mime_type = image_response.headers.get(
#             "content-type", "image/jpeg"
#         ).split(";")[0]

#     response = await client.aio.models.generate_content(
#         model="gemini-3.1-flash-image",
#         contents=[
#             types.Part.from_text(text=full_prompt),
#             types.Part.from_bytes(
#                 data=headshot_bytes,
#                 mime_type=mime_type,
#             ),
#         ],
#         config=types.GenerateContentConfig(
#             response_modalities=["IMAGE"],
#             image_config=types.ImageConfig(
#                 aspect_ratio="16:9",
#                 image_size="1K",
#             ),
#         ),
#     )

#     for part in response.parts:
#         if part.inline_data is not None:
#             image = part.as_image()

#             # Convert to PNG bytes for consistent output.
#             import io

#             output = io.BytesIO()
#             image.save(output, format="PNG")
#             return output.getvalue()

#     raise RuntimeError("No image generation result found in the response")

