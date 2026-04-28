export async function GET() {
  const API_KEY = process.env.WEATHER_API_KEY;

  console.log("API KEY:", API_KEY);

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=Piura&appid=${API_KEY}&units=metric`,
  );

  const data = await res.json();

  return Response.json(data);
}
