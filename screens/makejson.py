# usage: python3 makejson.py folder width
# eg: python3 makejson.py n64 640
# will result in a folder called n64_out and n64.json

import os, json, random, shutil, sys

def safe_filename(a):
	safe_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890."
	out = ""
	for c in a:
		if c in safe_chars:
			out += c
	return out

in_folder = sys.argv[1]
out_folder = in_folder + "_out/"
width = int(sys.argv[2])


games = []
game_names = []
ignored = ["(spain)", "dual shock ver", "(edc)", "(bs)", "(debug", "(gamecub", "(promo)", "(beta", "(jap", "(unl", "(proto", "(sample", "(asia", "(pal)", "(demo)", "(austral", "(france", "(german", "(italy", "(kiosk", "(ja)", "(shindou" ]

if not os.path.isdir(out_folder):
	os.makedirs(out_folder)

i = 0
for f in os.listdir(in_folder):
	if f.endswith("png"):
		ignore = False
		for x in ignored:
			if x in f.lower():
				ignore = True
		if ignore:
			print("ignoring:", f)
			continue

		#print(f)
		tit = f.split("(")[0].strip()

		if tit in game_names:
			print("dupe:", f)
			continue

		outname = safe_filename(tit + ".png")
		game = {
			"title": tit,
			"image": "screens/" + sys.argv[1] + "/" + outname,
			"width": width
		}
		games.append(game)
		game_names.append(tit)
		shutil.copy(in_folder + "/" + f, out_folder + outname)
		i += 1

random.shuffle(games)

#print(json.dumps(games, indent=4))

with open(in_folder + ".json", "w") as f:
	f.write(json.dumps(games,indent=4))
