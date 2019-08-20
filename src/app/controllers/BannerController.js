import Banner from '../models/Banner';

class FileController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = await Banner.create({
      name,
      path,
    });

    return res.json(file);
  }
}

export default new FileController();
