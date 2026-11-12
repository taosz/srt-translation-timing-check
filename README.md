# SRT translation timing check

Compare the cue counts and timestamps of an original and an existing translated SRT file. The script runs locally with Python 3.9+ and the standard library; it does not send, edit, or translate the files.

```sh
python check_srt_timing.py workshop.en.srt workshop.pt-BR.srt
python check_srt_timing.py original.srt translated.srt
```

The included six-cue English source was written for Scanfile. The Portuguese file is an actual output from an eligible Scanfile trial. Their timestamps match; this example is not an independent quality evaluation. The samples are available under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with attribution to Scanfile and an indication of changes. The script is offered under [MIT](LICENSE.txt).

The command prints JSON and returns exit code **0** for matching counts and times, **1** for a difference, and **2** for invalid input. It compares cues by position, not by numeric identifier. If counts differ it reports the difference without matching individual cues. Basic UTF-8 SRT only, at most 5 MiB per file; VTT, ASS and nonstandard timing extensions are not supported. It does not check overlapping or out-of-order cues. Error output can include a local file path.

A matching timeline does **not** prove translation accuracy, synchronization to video, reading speed or accessibility. Review the text with a fluent reader and watch the captions with the intended video.

This project is maintained by Scanfile, which separately offers a commercial subtitle translation service that uploads the document and uses the displayed trial and credit rules. The script works independently without a Scanfile account. This description was prepared with AI assistance.

## Automation

Run the command in an existing CI job after generating the two files; its exit code lets the job detect a mismatch. Keep private subtitle files out of public build logs and artifacts. The tool itself has no network requests, but your CI provider may store files according to its own settings.

## Sobre este projeto

Compare os tempos de um SRT original e outro já traduzido. O script é gratuito, funciona sem rede e não traduz as legendas. Um resultado igual não comprova qualidade, acessibilidade ou sincronização com o vídeo. O Scanfile também oferece um [tradutor comercial de legendas](https://scanfile.online/pt-br/tools/ai-subtitle-translator#legendas-youtube), separado deste script: a tradução exige envio do arquivo e segue as regras de teste e créditos mostradas no site. A descrição deste projeto foi preparada com auxílio de IA.

## Tests

```sh
python -m unittest test_check_srt_timing.py
```
