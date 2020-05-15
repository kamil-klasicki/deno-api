import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as yup from "https://cdn.pika.dev/yup@^0.28.1";
import { v4 } from "https://deno.land/std/uuid/mod.ts";

interface RequestError extends Error {
  status: number;
}

interface Games {
  id: string;
  name: string;
  image: string;
}

const GamesSchema = yup.object().shape({
  name: yup.string().trim().min(2).required(),
  image: yup.string().trim().url().required(),
});

const DB = new Map<string, Games>();

const router = new Router();
router
  .get("/", (context) => {
    context.response.body = {
      message: "Hello world 🤣🤣!",
    };
  })
  .get("/Games", (context) => {
    context.response.body = [...DB.values()];
  })
  .post("/Games", async (context) => {
    try {
      const body = await context.request.body();
      if (body.type !== "json") throw new Error("Invalid Body") as RequestError;
      const Games = await GamesSchema.validate(body.value) as Games;
      Games.id = v4.generate();
      DB.set(Games.id, Games);
      context.response.body = Games;
    } catch (error) {
      error.status = 422;
      throw error;
    }
  })
  .delete("/Games/:id", (context) => {
    const { id } = context.params;
    if (id && DB.has(id)) {
      context.response.status = 204;
      context.response.body = DB.get(id);
      DB.delete(id);
    } else {
      const error = new Error("Not Found! 🤢") as RequestError;
      error.status = 404;
      throw error;
    }
  });

const app = new Application();

app.use(async (context, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as RequestError;
    context.response.status = error.status || 500;
    context.response.body = {
      message: error.message,
    };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Listening on host 4242`);
await app.listen({ port: 4242 });
