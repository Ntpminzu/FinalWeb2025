import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));


app.use('/static', express.static('static'));


app.get('/', function (req, res) {
    const categories = [
        "AI - ChatGPT", "Lập trình - Web",
        "Data Analysis", "Machine Learning",
        "DevOps", "Cloud Computing",
        "Cybersecurity", "Blockchain",
        "IoT", "Mobile Development",
        "Game Development"
    ];
    res.render('home', { categories });
});


app.listen(4000, function () {
    console.log(`Server running at http://localhost:3000/`);
});
