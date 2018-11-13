from sklearn.svm import LinearSVR
# run without X
import matplotlib as mpl
mpl.use('Agg')

# will eventually do this in the correct way -- install a library/package
import os
import sys
parentPath = os.path.abspath("..")
if parentPath not in sys.path:
    sys.path.insert(0, parentPath)

from io_utils import Experiment
from skl_utils import generate_results

exp = Experiment('LinearSVR')
def main(args, input_data, tmpdir=exp.tmpdir):
    model = LinearSVR(loss=args['loss'], dual=args['dual'],
                      tol=args['tol'], C=args['C'], epsilon=args['epsilon'])
    generate_results(model, input_data, tmpdir, args['_id'], mode='regression')


if __name__ == "__main__":
    args, input_data = exp.get_input()
    main(args, input_data)